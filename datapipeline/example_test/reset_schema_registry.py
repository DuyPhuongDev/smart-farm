"""
Script to delete/reset schemas in Schema Registry

This is useful during development when you need to make breaking changes to schemas.
⚠️ WARNING: Only use in DEV/TEST environment!
"""

import requests
import sys
from logger_config import logger
from config import config


def delete_subject(schema_registry_url: str, subject: str):
    """
    Delete a subject (and all its schema versions) from Schema Registry
    
    Args:
        schema_registry_url: Schema Registry URL
        subject: Subject name (e.g., "iot.sensor.raw.v1-value")
    """
    try:
        # Delete all versions of the subject (soft delete)
        url = f"{schema_registry_url}/subjects/{subject}"
        response = requests.delete(url)
        
        if response.status_code == 200:
            versions = response.json()
            logger.info(f"✓ Soft deleted subject '{subject}' (versions: {versions})")
        elif response.status_code == 404:
            logger.warning(f"Subject '{subject}' not found - may already be deleted")
            return True
        else:
            logger.error(f"✗ Failed to delete subject: {response.status_code} - {response.text}")
            return False
        
        # Permanent delete
        url = f"{schema_registry_url}/subjects/{subject}?permanent=true"
        response = requests.delete(url)
        
        if response.status_code == 200:
            versions = response.json()
            logger.info(f"✓ Permanently deleted subject '{subject}' (versions: {versions})")
            return True
        else:
            logger.error(f"✗ Failed to permanently delete: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error deleting subject: {e}", exc_info=True)
        return False


def list_subjects(schema_registry_url: str):
    """
    List all subjects in Schema Registry
    
    Args:
        schema_registry_url: Schema Registry URL
    """
    try:
        url = f"{schema_registry_url}/subjects"
        response = requests.get(url)
        
        if response.status_code == 200:
            subjects = response.json()
            logger.info(f"\nFound {len(subjects)} subjects:")
            for subject in subjects:
                logger.info(f"  - {subject}")
            return subjects
        else:
            logger.error(f"✗ Failed to list subjects: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"❌ Error listing subjects: {e}", exc_info=True)
        return []


def get_schema_versions(schema_registry_url: str, subject: str):
    """
    Get all versions of a subject
    
    Args:
        schema_registry_url: Schema Registry URL
        subject: Subject name
    """
    try:
        url = f"{schema_registry_url}/subjects/{subject}/versions"
        response = requests.get(url)
        
        if response.status_code == 200:
            versions = response.json()
            logger.info(f"\nSubject '{subject}' has {len(versions)} version(s): {versions}")
            
            # Get details for each version
            for version in versions:
                url = f"{schema_registry_url}/subjects/{subject}/versions/{version}"
                response = requests.get(url)
                if response.status_code == 200:
                    data = response.json()
                    logger.info(f"\n  Version {version}:")
                    logger.info(f"    ID: {data.get('id')}")
                    logger.info(f"    Schema: {data.get('schema')}")
            
            return versions
        elif response.status_code == 404:
            logger.warning(f"Subject '{subject}' not found")
            return []
        else:
            logger.error(f"✗ Failed to get versions: {response.status_code} - {response.text}")
            return []
            
    except Exception as e:
        logger.error(f"❌ Error getting versions: {e}", exc_info=True)
        return []


def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Schema Registry Management Tool')
    parser.add_argument(
        'action',
        choices=['list', 'delete', 'versions'],
        help='Action: list (show all subjects), delete (remove subject), versions (show versions)'
    )
    parser.add_argument(
        '--subject',
        help='Subject name (required for delete/versions)'
    )
    parser.add_argument(
        '--url',
        default=config.schema_registry.url,
        help=f'Schema Registry URL (default: {config.schema_registry.url})'
    )
    
    args = parser.parse_args()
    
    logger.info("=" * 60)
    logger.info("Schema Registry Management Tool")
    logger.info("=" * 60)
    logger.info(f"URL: {args.url}")
    
    if args.action == 'list':
        subjects = list_subjects(args.url)
        if subjects:
            logger.info("\n✓ Done")
        return 0
        
    elif args.action == 'versions':
        if not args.subject:
            logger.error("❌ --subject required for 'versions' action")
            return 1
        
        get_schema_versions(args.url, args.subject)
        return 0
        
    elif args.action == 'delete':
        if not args.subject:
            logger.error("❌ --subject required for 'delete' action")
            return 1
        
        # Confirmation
        logger.warning(f"\n⚠️  You are about to DELETE subject: {args.subject}")
        logger.warning("⚠️  This will remove ALL versions of this schema!")
        confirm = input("\nType 'yes' to confirm: ")
        
        if confirm.lower() != 'yes':
            logger.info("Cancelled")
            return 0
        
        success = delete_subject(args.url, args.subject)
        return 0 if success else 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
