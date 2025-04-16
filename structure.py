import os

def create_directory_structure():
    # Define the base directory
    base_dir = "backend"
    
    # Create main directory
    os.makedirs(base_dir, exist_ok=True)
    
    # Create empty files in root
    root_files = [
        "app.py",
        "config.py",
        "requirements.txt"
    ]
    
    for file in root_files:
        with open(os.path.join(base_dir, file), 'w') as f:
            pass
    
    # Create models directory and its files
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    with open(os.path.join(models_dir, "__init__.py"), 'w') as f:
        pass
    with open(os.path.join(models_dir, "document.py"), 'w') as f:
        pass
    with open(os.path.join(models_dir, "chat.py"), 'w') as f:
        pass
    
    # Create services directory and its files
    services_dir = os.path.join(base_dir, "services")
    os.makedirs(services_dir, exist_ok=True)
    with open(os.path.join(services_dir, "__init__.py"), 'w') as f:
        pass
    with open(os.path.join(services_dir, "document_service.py"), 'w') as f:
        pass
    with open(os.path.join(services_dir, "analysis_service.py"), 'w') as f:
        pass
    with open(os.path.join(services_dir, "chat_service.py"), 'w') as f:
        pass
    
    # Create utils directory and its files
    utils_dir = os.path.join(base_dir, "utils")
    os.makedirs(utils_dir, exist_ok=True)
    with open(os.path.join(utils_dir, "__init__.py"), 'w') as f:
        pass
    with open(os.path.join(utils_dir, "file_utils.py"), 'w') as f:
        pass
    with open(os.path.join(utils_dir, "ai_utils.py"), 'w') as f:
        pass
    
    # Create uploads directory
    uploads_dir = os.path.join(base_dir, "uploads")
    os.makedirs(uploads_dir, exist_ok=True)

if __name__ == "__main__":
    create_directory_structure()
    print("Directory structure created successfully!")
