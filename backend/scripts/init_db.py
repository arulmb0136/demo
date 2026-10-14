import sys
import os

# Ensure backend root is on Python module search path
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User
from app.models.role_permission import RoleDefinition, DEFAULT_ROLES_SEED
from app.core.logging import logger

DEMO_USERS = [
    {
        "email": "admin@ironclad.demo",
        "full_name": "Alexander Hayes (System Administrator)",
        "password": "Admin123!",
        "role": "admin",
        "permissions": ["contracts:view", "contracts:download", "users:manage", "roles:manage", "read", "download", "admin"]
    },
    {
        "email": "manager@ironclad.demo",
        "full_name": "Victoria Sterling (Legal Ops Lead)",
        "password": "Manager123!",
        "role": "manager",
        "permissions": ["contracts:view", "contracts:download", "read", "download"]
    },
    {
        "email": "editor@ironclad.demo",
        "full_name": "Julian Mercer (Contract Specialist)",
        "password": "Editor123!",
        "role": "editor",
        "permissions": ["contracts:view", "contracts:download", "read", "download"]
    },
    {
        "email": "viewer@ironclad.demo",
        "full_name": "Claire Redfield (Compliance Auditor)",
        "password": "Viewer123!",
        "role": "viewer",
        "permissions": ["contracts:view", "read"]
    }
]

def init_database():
    """
    Creates tables and seeds initial users and role definitions.
    Contracts and documents are NOT stored in PostgreSQL; they are fetched live from Ironclad.
    """
    logger.info("Initializing PostgreSQL schema for User & Role Management...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema verified (Users & Role Definitions).")

    db = SessionLocal()
    try:
        # 1. Seed Role Definitions
        for role_data in DEFAULT_ROLES_SEED:
            existing_role = db.query(RoleDefinition).filter(RoleDefinition.role_key == role_data["role_key"]).first()
            if not existing_role:
                db_role = RoleDefinition(**role_data)
                db.add(db_role)
                logger.info(f"Seeded role definition: {role_data['role_key']}")
            else:
                existing_role.display_name = role_data["display_name"]
                existing_role.description = role_data["description"]
                existing_role.default_permissions = role_data["default_permissions"]

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
        logger.info("PostgreSQL User & Role Management initialization successfully completed!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error initializing database: {e}", exc_info=True)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
