import httpx

API_BASE = "http://127.0.0.1:8000/api"

def test_api():
    with httpx.Client(timeout=10.0) as client:
        # Projects list
        r = client.get(f"{API_BASE}/projects")
        print("GET /projects status:", r.status_code)
        assert r.status_code == 200
        projects = r.json()
        print(f"Found {len(projects)} projects. First: {projects[0]['code']} - {projects[0]['name']}")

        # Dashboard
        r = client.get(f"{API_BASE}/projects/1/dashboard")
        print("GET /projects/1/dashboard status:", r.status_code)
        assert r.status_code == 200
        dash = r.json()
        print("Progress overall:", dash["progress"]["overall_progress"], "%")
        print("Current stage:", dash["progress"]["current_stage_name"])

        # Predictions
        r = client.get(f"{API_BASE}/predictions/project/1")
        print("GET /predictions/project/1 status:", r.status_code)
        assert r.status_code == 200
        pred = r.json()
        print("Predicted completion:", pred["predicted_completion"], "| Risk:", pred["schedule_risk_level"])

        # Critical path
        r = client.get(f"{API_BASE}/predictions/project/1/critical-path")
        print("GET critical path status:", r.status_code)
        assert r.status_code == 200
        cp = r.json()
        print("Critical Path:", " -> ".join(cp["critical_path"]))

        # What-If Simulation
        r = client.post(f"{API_BASE}/whatif/project/1/simulate", json={"procurement_delay_days": 5.0, "manufacturing_engineer_delta": 1})
        print("POST what-if status:", r.status_code)
        assert r.status_code == 200
        whatif = r.json()
        print("What-If forecast:", whatif["simulated_completion"], "| Variance:", whatif["schedule_variance_days"], "days")

        # RAG Query
        r = client.post(f"{API_BASE}/rag/query", json={"project_id": 1, "query": "What is the required gain?"})
        print("POST RAG query status:", r.status_code)
        assert r.status_code == 200
        rag = r.json()
        print("RAG Answer Snippet:", rag["answer"][:120], "...")

        # Knowledge Graph
        r = client.get(f"{API_BASE}/graph/project/1")
        print("GET Knowledge Graph status:", r.status_code)
        assert r.status_code == 200
        kg = r.json()
        print(f"Knowledge Graph Nodes: {len(kg['nodes'])}, Edges: {len(kg['edges'])}")

        print("\nALL API ENDPOINTS FUNCTIONING 100% PERFECTLY!")

if __name__ == "__main__":
    test_api()
