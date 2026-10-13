import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import text

# Ensure backend root is on Python module search path
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.contract import Contract
from app.models.document import Document
from app.models.role_permission import RoleDefinition, DEFAULT_ROLES_SEED
from app.core.logging import logger

DEMO_USERS = [
    {
        "email": "admin@ironclad.demo",
        "full_name": "Alexander Hayes (System Administrator)",
        "password": "Admin123!",
        "role": "admin",
        "permissions": ["read", "write", "edit", "delete", "admin"]
    },
    {
        "email": "manager@ironclad.demo",
        "full_name": "Victoria Sterling (Legal Ops Lead)",
        "password": "Manager123!",
        "role": "manager",
        "permissions": ["read", "write", "edit"]
    },
    {
        "email": "editor@ironclad.demo",
        "full_name": "Julian Mercer (Contract Specialist)",
        "password": "Editor123!",
        "role": "editor",
        "permissions": ["read", "write", "edit"]
    },
    {
        "email": "viewer@ironclad.demo",
        "full_name": "Claire Redfield (Compliance Auditor)",
        "password": "Viewer123!",
        "role": "viewer",
        "permissions": ["read"]
    }
]

# Sample contracts with complete lifecycle tracking dates
SAMPLE_CONTRACTS = [
    {
        "ironclad_id": "ic_wf_101",
        "title": "Enterprise Cloud Subscription Agreement",
        "template_name": "Master Services Agreement",
        "record_type": "contract",
        "status": "signed",
        "counterparty_name": "Stripe Payments Inc",
        "contract_value": 350000.0,
        "currency": "USD",
        "department": "Engineering",
        "creator_email": "admin@ironclad.demo",
        "agreement_delta_days": -70,
        "start_delta_days": -60,
        "completion_delta_days": 305,
        "signed_delta_days": -65,
        "notice_delta_days": 275,
        "documents": [
            {"name": "Stripe_MSA_Final_Signed.pdf", "s3_key": "contracts/ic_wf_101/Stripe_MSA_Final_Signed.pdf"}
        ],
        "attributes": {"autoRenew": True, "noticePeriodDays": 30, "slaTier": "Platinum"},
        "related_records": [{"recordId": "rec_master_agreement_parent"}]
    },
    {
        "ironclad_id": "ic_wf_102",
        "title": "Global Data Processing Agreement (DPA)",
        "template_name": "Data Processing Addendum",
        "record_type": "contract",
        "status": "in_review",
        "counterparty_name": "Snowflake Computing",
        "contract_value": 185000.0,
        "currency": "USD",
        "department": "Security",
        "creator_email": "manager@ironclad.demo",
        "agreement_delta_days": -12,
        "start_delta_days": 0,
        "completion_delta_days": 730,
        "signed_delta_days": None,
        "notice_delta_days": 700,
        "documents": [
            {"name": "Snowflake_DPA_Legal_Review.pdf", "s3_key": "contracts/ic_wf_102/Snowflake_DPA_Legal_Review.pdf"}
        ],
        "attributes": {"gdpr": True, "ccpa": True, "euUsFramework": True},
        "related_records": []
    },
    {
        "ironclad_id": "ic_wf_103",
        "title": "Mutual Non-Disclosure Agreement (MNDA)",
        "template_name": "Mutual NDA",
        "record_type": "nda",
        "status": "signed",
        "counterparty_name": "OpenAI Technologies",
        "contract_value": 0.0,
        "currency": "USD",
        "department": "Legal",
        "creator_email": "editor@ironclad.demo",
        "agreement_delta_days": -45,
        "start_delta_days": -45,
        "completion_delta_days": 685,
        "signed_delta_days": -45,
        "notice_delta_days": 655,
        "documents": [
            {"name": "OpenAI_Mutual_NDA_Countersigned.pdf", "s3_key": "contracts/ic_wf_103/OpenAI_Mutual_NDA_Countersigned.pdf"}
        ],
        "attributes": {"termYears": 2, "governingLaw": "California"},
        "related_records": []
    },
    {
        "ironclad_id": "ic_wf_104",
        "title": "Vendor Statement of Work - Security Observability",
        "template_name": "Statement of Work",
        "record_type": "statement-of-work",
        "status": "out_for_signature",
        "counterparty_name": "Datadog Observability",
        "contract_value": 120000.0,
        "currency": "USD",
        "department": "DevOps",
        "creator_email": "manager@ironclad.demo",
        "agreement_delta_days": -5,
        "start_delta_days": 5,
        "completion_delta_days": 365,
        "signed_delta_days": None,
        "notice_delta_days": 335,
        "documents": [
            {"name": "Datadog_SOW_Execution_Copy.pdf", "s3_key": "contracts/ic_wf_104/Datadog_SOW_Execution_Copy.pdf"}
        ],
        "attributes": {"paymentTerms": "Net 30", "milestones": 3},
        "related_records": [{"recordId": "rec_datadog_master_2025"}]
    },
    {
        "ironclad_id": "ic_wf_105",
        "title": "Workplace Enterprise Software License",
        "template_name": "Software License Agreement",
        "record_type": "contract",
        "status": "draft",
        "counterparty_name": "Microsoft Corporation",
        "contract_value": 450000.0,
        "currency": "USD",
        "department": "IT Operations",
        "creator_email": "editor@ironclad.demo",
        "agreement_delta_days": 0,
        "start_delta_days": 10,
        "completion_delta_days": 375,
        "signed_delta_days": None,
        "notice_delta_days": 345,
        "documents": [
            {"name": "Microsoft_M365_Draft_Terms.docx", "s3_key": "contracts/ic_wf_105/Microsoft_M365_Draft_Terms.docx"}
        ],
        "attributes": {"seats": 1500, "hybridBenefits": True},
        "related_records": []
    },
    {
        "ironclad_id": "ic_wf_106",
        "title": "Tier 1 Customer Order Form & SLA",
        "template_name": "Order Form",
        "record_type": "order-form",
        "status": "signed",
        "counterparty_name": "Amazon Web Services",
        "contract_value": 620000.0,
        "currency": "USD",
        "department": "Sales",
        "creator_email": "admin@ironclad.demo",
        "agreement_delta_days": -120,
        "start_delta_days": -90,
        "completion_delta_days": 275,
        "signed_delta_days": -95,
        "notice_delta_days": 245,
        "documents": [
            {"name": "AWS_Enterprise_Discount_OrderForm.pdf", "s3_key": "contracts/ic_wf_106/AWS_Enterprise_Discount_OrderForm.pdf"}
        ],
        "attributes": {"billingModel": "Annual Prepaid", "enterpriseSupport": True},
        "related_records": []
    }
]

def migrate_columns_if_needed(db):
    """Gracefully migrates SQLite or PostgreSQL contracts table with new date tracking columns"""
    columns = [
        ("record_type", "VARCHAR(50) DEFAULT 'contract'"),
        ("related_records", "JSON DEFAULT '[]'"),
        ("agreement_date", "DATETIME"),
        ("start_date", "DATETIME"),
        ("completion_date", "DATETIME"),
        ("signed_date", "DATETIME"),
        ("last_synced_date", "DATETIME"),
        ("renewal_notice_date", "DATETIME")
    ]
    for col_name, col_type in columns:
        try:
            db.execute(text(f"ALTER TABLE contracts ADD COLUMN {col_name} {col_type}"))
            db.commit()
            logger.info(f"Migrated column: contracts.{col_name}")
        except Exception:
            db.rollback()

def init_database():
    """Creates tables and seeds initial users and contracts with lifecycle tracking dates"""
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified.")

    db = SessionLocal()
    try:
        migrate_columns_if_needed(db)

        # 1. Seed Role Definitions
        for role_data in DEFAULT_ROLES_SEED:
            existing_role = db.query(RoleDefinition).filter(RoleDefinition.role_key == role_data["role_key"]).first()
            if not existing_role:
                db_role = RoleDefinition(**role_data)
                db.add(db_role)
                logger.info(f"Seeded role definition: {role_data['role_key']}")

        # 2. Seed Demo Users
        for user_data in DEMO_USERS:
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if not existing_user:
                new_user = User(
                    email=user_data["email"],
                    full_name=user_data["full_name"],
                    hashed_password=get_password_hash(user_data["password"]),
                    role=user_data["role"],
                    permissions=user_data["permissions"],
                    is_active=True
                )
                db.add(new_user)
                logger.info(f"Seeded demo user: {user_data['email']} (Role: {user_data['role']})")
            else:
                existing_user.role = user_data["role"]
                existing_user.permissions = user_data["permissions"]

        db.commit()

        # 3. Seed Sample Contracts & Documents with Tracking Dates
        now = datetime.utcnow()
        for c_data in SAMPLE_CONTRACTS:
            existing_c = db.query(Contract).filter(Contract.ironclad_id == c_data["ironclad_id"]).first()
            
            agr_date = now + timedelta(days=c_data["agreement_delta_days"])
            start_date = now + timedelta(days=c_data["start_delta_days"])
            comp_date = now + timedelta(days=c_data["completion_delta_days"])
            sign_date = now + timedelta(days=c_data["signed_delta_days"]) if c_data.get("signed_delta_days") is not None else None
            not_date = now + timedelta(days=c_data["notice_delta_days"]) if c_data.get("notice_delta_days") is not None else None

            if existing_c:
                existing_c.agreement_date = agr_date
                existing_c.start_date = start_date
                existing_c.completion_date = comp_date
                existing_c.signed_date = sign_date
                existing_c.last_synced_date = now
                existing_c.renewal_notice_date = not_date
                existing_c.effective_date = start_date
                existing_c.expiration_date = comp_date
            else:
                contract = Contract(
                    ironclad_id=c_data["ironclad_id"],
                    title=c_data["title"],
                    template_name=c_data["template_name"],
                    record_type=c_data.get("record_type", "contract"),
                    status=c_data["status"],
                    counterparty_name=c_data["counterparty_name"],
                    contract_value=c_data["contract_value"],
                    currency=c_data["currency"],
                    agreement_date=agr_date,
                    start_date=start_date,
                    completion_date=comp_date,
                    signed_date=sign_date,
                    last_synced_date=now,
                    renewal_notice_date=not_date,
                    effective_date=start_date,
                    expiration_date=comp_date,
                    department=c_data["department"],
                    creator_email=c_data["creator_email"],
                    attributes=c_data["attributes"],
                    related_records=c_data.get("related_records", [])
                )
                db.add(contract)
                db.flush()

                for d_info in c_data.get("documents", []):
                    doc = Document(
                        contract_id=contract.id,
                        name=d_info["name"],
                        s3_key=d_info["s3_key"],
                        file_size_bytes=1572864,
                        content_type="application/pdf" if d_info["name"].endswith(".pdf") else "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        document_url=f"/api/v1/files/download-local/{d_info['name']}"
                    )
                    db.add(doc)
                logger.info(f"Seeded sample contract with tracking dates: '{contract.title}'")

        # 4. Backfill any existing contracts missing tracking dates
        untracked = db.query(Contract).filter(Contract.start_date.is_(None)).all()
        for idx, u_cnt in enumerate(untracked):
            ref_start = u_cnt.created_at or (now - timedelta(days=30))
            u_cnt.agreement_date = ref_start
            u_cnt.start_date = ref_start
            u_cnt.completion_date = ref_start + timedelta(days=180 + (idx % 6) * 30)
            u_cnt.last_synced_date = now
            u_cnt.renewal_notice_date = u_cnt.completion_date - timedelta(days=30)
            u_cnt.effective_date = u_cnt.start_date
            u_cnt.expiration_date = u_cnt.completion_date
            if u_cnt.status == "signed" and not u_cnt.signed_date:
                u_cnt.signed_date = ref_start
            logger.info(f"Backfilled lifecycle tracking dates for contract ID {u_cnt.id}: '{u_cnt.title}'")

        db.commit()
        logger.info("Database seeding and tracking dates migration successfully completed!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}", exc_info=True)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
