from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal, engine, Base
from app.models.entities import (
    Project, WorkflowStage, Requirement, RequirementVersion, Design, DesignVersion,
    Simulation, ProcurementOrder, Test, Review, Document, DocumentChunk, AuditLog, Notification,
    StageState, VerificationStatus
)

def seed_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        now = datetime.utcnow()
        start_date = now - timedelta(days=20)
        planned_end_date = now + timedelta(days=25)

        # -------------------------------------------------------------
        # PROJECT 1: P001 (X-Band Airborne Antenna System)
        # -------------------------------------------------------------
        p1 = Project(
            code="P001",
            name="X-Band Airborne Antenna System",
            description="High-gain broadband airborne antenna operating across 8-12 GHz for ABC Company engineering workflows.",
            status="IN_PROGRESS",
            planned_start=start_date,
            planned_end=planned_end_date,
            actual_start=start_date
        )
        db.add(p1)
        db.commit()
        db.refresh(p1)

        # Workflow Stages & Department Weights
        stages_data = [
            ("Requirements Engineering", "Requirements Department", 0.10, 1, StageState.APPROVED.value, 100.0, -20, -18),
            ("RF Design", "RF / Antenna Department", 0.15, 2, StageState.APPROVED.value, 100.0, -18, -12),
            ("Design Review", "Systems Engineering Lead", 0.05, 3, StageState.APPROVED.value, 100.0, -12, -10),
            ("Simulation", "Simulation & Modeling Department", 0.15, 4, StageState.APPROVED.value, 100.0, -10, -4),
            ("Procurement", "Procurement Department", 0.10, 5, StageState.IN_PROGRESS.value, 60.0, -4, 5),
            ("Manufacturing", "Manufacturing & Assembly", 0.20, 6, StageState.PENDING.value, 0.0, 5, 15),
            ("Testing", "Testing & Qualification", 0.15, 7, StageState.PENDING.value, 0.0, 15, 20),
            ("QA / Validation", "Quality Assurance", 0.05, 8, StageState.PENDING.value, 0.0, 20, 22),
            ("Documentation", "Technical Documentation", 0.05, 9, StageState.PENDING.value, 0.0, 22, 24),
            ("Delivery", "Project Delivery", 0.05, 10, StageState.PENDING.value, 0.0, 24, 25)
        ]

        stage_objs = []
        for name, dept, wt, idx, st, prog, s_off, e_off in stages_data:
            s_dt = start_date + timedelta(days=s_off)
            e_dt = start_date + timedelta(days=e_off)
            act_s = s_dt if st != StageState.PENDING.value else None
            act_e = e_dt if st == StageState.APPROVED.value else None
            
            is_bl = True if name == "Manufacturing" and st == StageState.PENDING.value else False
            bl_reason = "Awaiting component procurement arrival" if is_bl else None

            ws = WorkflowStage(
                project_id=p1.id,
                stage_name=name,
                department_name=dept,
                weight=wt,
                order_index=idx,
                state=st,
                progress_percentage=prog,
                planned_start=s_dt,
                planned_end=e_dt,
                actual_start=act_s,
                actual_end=act_e,
                estimated_remaining_days=max(0, (e_dt - now).days),
                is_blocked=is_bl,
                block_reason=bl_reason
            )
            db.add(ws)
            stage_objs.append(ws)

        db.commit()

        # Requirements (REQ-001 to REQ-006)
        reqs = [
            ("REQ-001", "Frequency Bandwidth", "Electrical/RF", "Operating frequency range 8.0 - 12.0 GHz", "8.0 - 12.0 GHz", VerificationStatus.VERIFIED.value),
            ("REQ-002", "Boresight Gain", "Electrical/RF", "Boresight peak gain over 8-12 GHz band", ">= 12.0 dBi", VerificationStatus.VERIFIED.value),
            ("REQ-003", "Voltage Standing Wave Ratio", "Electrical/RF", "Input VSWR across operational band", "< 2.0", VerificationStatus.VERIFIED.value),
            ("REQ-004", "Operating Temperature Range", "Environmental/Thermal", "Operational thermal limits for aerospace airborne deployment", "-40°C to +85°C", VerificationStatus.UNVERIFIED.value),
            ("REQ-005", "Polarization Specification", "Electrical/RF", "Dual linear polarization with > 25 dB cross-pol isolation", "Dual Linear", VerificationStatus.VERIFIED.value),
            ("REQ-006", "Mechanical Envelope Constraint", "Mechanical", "Physical package envelope dimensions for pod mounting", "< 120 x 80 x 45 mm", VerificationStatus.VERIFIED.value)
        ]

        req_objs = []
        for code, title, cat, spec, tgt, status in reqs:
            r = Requirement(
                project_id=p1.id,
                req_code=code,
                title=title,
                category=cat,
                specification_text=spec,
                target_value=tgt,
                verification_status=status
            )
            db.add(r)
            db.commit()
            db.refresh(r)
            req_objs.append(r)

            rv = RequirementVersion(
                requirement_id=r.id,
                version_number=1,
                title=title,
                specification_text=spec,
                target_value=tgt,
                changed_by="Systems Engineer",
                change_reason="Initial Baseline Customer Requirement Spec"
            )
            db.add(rv)

        # Design & Revision V1
        des = Design(
            project_id=p1.id,
            requirement_id=req_objs[1].id, # Linked to REQ-002 Gain
            design_code="DESIGN-021",
            title="X-Band Horn Antenna Array Geometry & Substrate Feed",
            designer_name="Dr. A. Sharma (Lead RF Engineer)",
            current_version_number=1,
            status="APPROVED"
        )
        db.add(des)
        db.commit()
        db.refresh(des)

        dv1 = DesignVersion(
            design_id=des.id,
            version_number=1,
            geometry_spec="Wideband Aperture Horn 115x75mm with Rogers 5880 microstrip feed network",
            frequency_range="8.0 - 12.0 GHz",
            polarization="Dual Linear",
            parameters_json={"dielectric_constant": 2.2, "aperture_width_mm": 115, "aperture_height_mm": 75},
            notes="Design V1 submitted for 3D EM Simulation verification.",
            status="APPROVED"
        )
        db.add(dv1)
        db.commit()
        db.refresh(dv1)

        # Simulation
        sim1 = Simulation(
            project_id=p1.id,
            design_version_id=dv1.id,
            sim_code="SIM-031",
            name="HFSS 3D Full-Wave EM Radiation Pattern & S-Parameter Simulation",
            software_tool="Ansys HFSS 2024 R1",
            measured_gain_dbi=12.8,
            vswr=1.58,
            s11_db=-16.4,
            status="PASS",
            findings_summary="Peak gain 12.8 dBi achieved at 10.0 GHz. Input VSWR <= 1.6 across 8-12 GHz band. S11 < -15 dB."
        )
        db.add(sim1)
        db.commit()
        db.refresh(sim1)

        # Procurement Orders
        p_orders = [
            ("PO-901", "Rogers RT/duroid 5880 High Frequency Laminate Substrate", "R5880-060-1010", 5, "ORDERED", "Rogers Corporation", -4, 2, 0),
            ("PO-902", "Custom Precision CNC Aluminum 6061-T6 Antenna Chassis", "AL-CHAS-X01", 2, "DELAYED", "Precision Aero Machining Inc", -4, 8, 4),
            ("PO-903", "SMA Coaxial Connectors DC-18GHz High Performance", "SMA-18G-FLANGE", 10, "RECEIVED", "Amphenol RF", -10, -2, 0)
        ]

        for code, comp, part, qty, st, supp, s_off, e_off, del_days in p_orders:
            po = ProcurementOrder(
                project_id=p1.id,
                po_code=code,
                component_name=comp,
                part_number=part,
                quantity=qty,
                status=st,
                supplier=supp,
                planned_delivery=start_date + timedelta(days=e_off),
                estimated_delivery=start_date + timedelta(days=e_off + del_days),
                delay_days=del_days
            )
            db.add(po)

        # Tests
        t1 = Test(
            project_id=p1.id,
            sim_id=sim1.id,
            test_code="TEST-041",
            title="Anechoic Chamber Far-Field Radiation Pattern Measurement Procedure",
            test_type="Anechoic Chamber Calibration",
            pass_criteria="Peak Gain >= 12.0 dBi, Cross-Pol Isolation > 25 dB, VSWR < 2.0",
            measured_result="Pending completion of manufacturing assembly stage.",
            status="PENDING"
        )
        db.add(t1)

        # Engineering Documents & RAG Chunks
        doc1 = Document(
            project_id=p1.id,
            doc_code="DOC-014",
            title="ABC Company Technical Specification & Compliance Report",
            category="Customer Specification",
            content_text="ABC Company Airborne Antenna Specification. Operating Frequency: 8.0 to 12.0 GHz. Required Boresight Gain: >= 12.0 dBi across band. Input VSWR must remain under 2.0. Operating temperature range is -40°C to +85°C for high-altitude aerospace environments."
        )
        db.add(doc1)
        db.commit()
        db.refresh(doc1)

        chunks_data = [
            (doc1.id, 1, "Section 2.1 - Electrical Specifications", "The airborne antenna system operates over the frequency band of 8.0 to 12.0 GHz. Boresight peak gain shall exceed 12.0 dBi. VSWR shall be strictly less than 2.0:1 across all operational elevation angles."),
            (doc1.id, 2, "Section 4.3 - Thermal & Environmental Requirements", "The equipment shall operate reliably within ambient temperature limits from -40°C to +85°C in accordance with MIL-STD-810H vibration and thermal shock standards.")
        ]
        for d_id, c_idx, sec, txt in chunks_data:
            chk = DocumentChunk(document_id=d_id, chunk_index=c_idx, section_title=sec, chunk_text=txt)
            db.add(chk)

        # Audit Log
        audits = [
            ("Systems Engineer", "Requirements Engineering", "APPROVED", "WorkflowStage", "1", "Requirements stage approved and baseline requirement REQ-001 to REQ-006 validated."),
            ("Dr. A. Sharma", "RF / Antenna Department", "SUBMITTED", "DesignVersion", "DESIGN-021-V1", "Submitted Horn Array Geometry V1 for Ansys HFSS EM Simulation."),
            ("Sim Lead", "Simulation & Modeling Department", "APPROVED", "Simulation", "SIM-031", "HFSS simulation passed: Gain 12.8 dBi, VSWR 1.58 achieved."),
            ("Procurement Officer", "Procurement Department", "DELAYED", "ProcurementOrder", "PO-902", "Supplier notified 4-day delay on CNC Aluminum Chassis delivery due to raw material lead time.")
        ]
        for u, d, a, et, ei, det in audits:
            al = AuditLog(
                project_id=p1.id,
                user_name=u,
                department=d,
                action=a,
                entity_type=et,
                entity_id=ei,
                details=det,
                timestamp=now - timedelta(hours=6)
            )
            db.add(al)

        # Notifications
        notifs = [
            ("Procurement Department", "Component Delay Alert: PO-902", "Chassis CNC delivery delayed by 4 days from Precision Aero Machining.", "WARNING"),
            ("Manufacturing & Assembly", "Stage Blocked: Manufacturing", "Manufacturing is blocked pending receipt of Rogers 5880 laminate substrate (PO-901).", "INFO")
        ]
        for dept, title, msg, sev in notifs:
            no = Notification(
                project_id=p1.id,
                target_department=dept,
                title=title,
                message=msg,
                severity=sev
            )
            db.add(no)

        # -------------------------------------------------------------
        # PROJECT 2: Project P002 (GNSS Triple-Band Antenna)
        # -------------------------------------------------------------
        p2 = Project(
            code="P002",
            name="GNSS Triple-Band Anti-Jamming Antenna",
            description="Multi-band L1/L2/L5 GNSS phased array antenna system for ABC Company.",
            status="IN_PROGRESS",
            planned_start=now - timedelta(days=10),
            planned_end=now + timedelta(days=40),
            actual_start=now - timedelta(days=10)
        )
        db.add(p2)
        db.commit()

        # -------------------------------------------------------------
        # PROJECT 3: Project P003 (SDR Tactical Transceiver)
        # -------------------------------------------------------------
        p3 = Project(
            code="P003",
            name="SDR Tactical RF Transceiver Module",
            description="S-Band airborne Software Defined Radio transceiver power amplifier module for ABC Company.",
            status="IN_PROGRESS",
            planned_start=now - timedelta(days=5),
            planned_end=now + timedelta(days=50),
            actual_start=now - timedelta(days=5)
        )
        db.add(p3)

        db.commit()
        print("Database successfully seeded for ABC Company with projects P001, P002, P003!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
