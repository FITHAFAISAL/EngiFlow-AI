from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum
from app.database.connection import Base

class StageState(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    COMPLETED = "COMPLETED"
    BLOCKED = "BLOCKED"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True) # e.g. P001
    name = Column(String(200), nullable=False) # X-Band Airborne Antenna Development
    description = Column(Text, nullable=True)
    status = Column(String(50), default="IN_PROGRESS") # IN_PROGRESS, COMPLETED, ON_HOLD
    planned_start = Column(DateTime, nullable=False)
    planned_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    stages = relationship("WorkflowStage", back_populates="project", cascade="all, delete-orphan", order_by="WorkflowStage.order_index")
    requirements = relationship("Requirement", back_populates="project", cascade="all, delete-orphan")
    designs = relationship("Design", back_populates="project", cascade="all, delete-orphan")
    simulations = relationship("Simulation", back_populates="project", cascade="all, delete-orphan")
    procurement_orders = relationship("ProcurementOrder", back_populates="project", cascade="all, delete-orphan")
    tests = relationship("Test", back_populates="project", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="project", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="project", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="project", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="project", cascade="all, delete-orphan")

class WorkflowStage(Base):
    __tablename__ = "workflow_stages"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stage_name = Column(String(100), nullable=False) # e.g., RF Design
    department_name = Column(String(100), nullable=False) # e.g., RF / Antenna Department
    weight = Column(Float, nullable=False) # e.g., 0.15 for 15%
    order_index = Column(Integer, nullable=False)
    state = Column(String(50), default=StageState.PENDING.value)
    progress_percentage = Column(Float, default=0.0)
    planned_start = Column(DateTime, nullable=False)
    planned_end = Column(DateTime, nullable=False)
    actual_start = Column(DateTime, nullable=True)
    actual_end = Column(DateTime, nullable=True)
    estimated_remaining_days = Column(Float, default=0.0)
    is_blocked = Column(Boolean, default=False)
    block_reason = Column(Text, nullable=True)

    project = relationship("Project", back_populates="stages")
    reviews = relationship("Review", back_populates="stage")

class Requirement(Base):
    __tablename__ = "requirements"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    req_code = Column(String(50), nullable=False, index=True) # e.g. REQ-001
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="Electrical/RF") # RF, Mechanical, Thermal, Environmental
    specification_text = Column(Text, nullable=False) # Frequency range 8-12 GHz
    target_value = Column(String(100), nullable=True) # >= 12 dBi
    verification_status = Column(String(50), default=VerificationStatus.UNVERIFIED.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="requirements")
    versions = relationship("RequirementVersion", back_populates="requirement", cascade="all, delete-orphan")

class RequirementVersion(Base):
    __tablename__ = "requirement_versions"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=False)
    version_number = Column(Integer, nullable=False) # 1, 2, 3
    title = Column(String(200), nullable=False)
    specification_text = Column(Text, nullable=False)
    target_value = Column(String(100), nullable=True)
    changed_by = Column(String(100), default="System User")
    change_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    requirement = relationship("Requirement", back_populates="versions")

class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    requirement_id = Column(Integer, ForeignKey("requirements.id"), nullable=True)
    design_code = Column(String(50), nullable=False, index=True) # e.g. DESIGN-021
    title = Column(String(200), nullable=False)
    designer_name = Column(String(100), default="Dr. A. Sharma (RF Lead)")
    current_version_number = Column(Integer, default=1)
    status = Column(String(50), default="IN_PROGRESS") # IN_PROGRESS, SUBMITTED, APPROVED, REVISION_REQUIRED

    project = relationship("Project", back_populates="designs")
    versions = relationship("DesignVersion", back_populates="design", cascade="all, delete-orphan")

class DesignVersion(Base):
    __tablename__ = "design_versions"

    id = Column(Integer, primary_key=True, index=True)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False)
    version_number = Column(Integer, nullable=False) # V1, V2, V3
    geometry_spec = Column(Text, nullable=False) # Aperture 115x75mm, Microstrip Feed
    frequency_range = Column(String(100), nullable=False) # 8-12 GHz
    polarization = Column(String(100), default="Dual Linear")
    parameters_json = Column(JSON, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(50), default="SUBMITTED") # DRAFT, SUBMITTED, REJECTED, APPROVED
    created_at = Column(DateTime, default=datetime.utcnow)

    design = relationship("Design", back_populates="versions")
    simulations = relationship("Simulation", back_populates="design_version")

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    design_version_id = Column(Integer, ForeignKey("design_versions.id"), nullable=False)
    sim_code = Column(String(50), nullable=False, index=True) # e.g. SIM-031
    name = Column(String(200), nullable=False)
    software_tool = Column(String(100), default="Ansys HFSS 2024 R1")
    measured_gain_dbi = Column(Float, nullable=False)
    vswr = Column(Float, nullable=False)
    s11_db = Column(Float, nullable=False)
    status = Column(String(50), nullable=False) # PASS, FAIL
    findings_summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="simulations")
    design_version = relationship("DesignVersion", back_populates="simulations")
    tests = relationship("Test", back_populates="simulation")

class ProcurementOrder(Base):
    __tablename__ = "procurement_orders"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    po_code = Column(String(50), nullable=False, index=True) # PO-901
    component_name = Column(String(200), nullable=False) # Low-Loss Substrate Rogers RT/duroid 5880
    part_number = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    status = Column(String(50), default="PENDING") # PENDING, ORDERED, DELAYED, RECEIVED
    supplier = Column(String(150), default="Rogers Corp / Microwave Components Inc")
    planned_delivery = Column(DateTime, nullable=False)
    estimated_delivery = Column(DateTime, nullable=False)
    delay_days = Column(Integer, default=0)

    project = relationship("Project", back_populates="procurement_orders")

class Test(Base):
    __tablename__ = "tests"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    sim_id = Column(Integer, ForeignKey("simulations.id"), nullable=True)
    test_code = Column(String(50), nullable=False, index=True) # TEST-041
    title = Column(String(200), nullable=False)
    test_type = Column(String(100), default="Anechoic Chamber Radiation Pattern")
    pass_criteria = Column(Text, nullable=False)
    measured_result = Column(Text, nullable=True)
    status = Column(String(50), default="PENDING") # PENDING, IN_PROGRESS, PASS, FAIL
    conducted_at = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="tests")
    simulation = relationship("Simulation", back_populates="tests")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    stage_id = Column(Integer, ForeignKey("workflow_stages.id"), nullable=False)
    review_code = Column(String(50), nullable=False, index=True) # REVIEW-008
    reviewer_role = Column(String(100), nullable=False) # Lead Engineer
    reviewer_name = Column(String(100), nullable=False)
    verdict = Column(String(50), nullable=False) # APPROVED, REJECTED, CHANGES_REQUESTED
    ai_recommendation = Column(String(50), nullable=True) # SUGGEST_APPROVE, CAUTION_REJECT
    findings_json = Column(JSON, nullable=True)
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="reviews")
    stage = relationship("WorkflowStage", back_populates="reviews")

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    doc_code = Column(String(50), nullable=False, index=True) # DOC-014
    title = Column(String(200), nullable=False)
    category = Column(String(100), default="Verification Report") # Customer Spec, Design Doc, Test Report, Standard
    content_text = Column(Text, nullable=False)
    file_path = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    section_title = Column(String(200), nullable=True)

    document = relationship("Document", back_populates="chunks")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    user_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False) # SUBMITTED, APPROVED, REJECTED, REVISION_CREATED, REQ_CHANGED
    entity_type = Column(String(50), nullable=False) # Stage, Requirement, Design, Simulation
    entity_id = Column(String(50), nullable=False)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="audit_logs")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    target_department = Column(String(100), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    severity = Column(String(20), default="INFO") # INFO, WARNING, SUCCESS, ERROR
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="notifications")
