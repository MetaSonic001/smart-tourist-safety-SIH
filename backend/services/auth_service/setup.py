from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

with open("requirements.txt", "r", encoding="utf-8") as fh:
    requirements = [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="smart-tourist-auth",
    version="1.0.0",
    author="Smart India Hackathon Team",
    author_email="team@smarttourist.com",
    description="Authentication & Onboarding Service for Smart Tourist Safety Monitoring",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/your-org/smart-tourist-auth",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
        "Framework :: FastAPI",
    ],
    python_requires=">=3.11",
    install_requires=requirements,
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "isort>=5.12.0",
            "flake8>=6.0.0",
            "mypy>=1.0.0",
        ],
        "test": [
            "pytest>=7.0.0",
            "pytest-asyncio>=0.21.0",
            "httpx>=0.25.0",
            "locust>=2.15.0",
        ],
        "production": [
            "gunicorn>=21.0.0",
            "sentry-sdk>=1.32.0",
            "prometheus-client>=0.17.0",
        ]
    },
    entry_points={
        "console_scripts": [
            "auth-service=main:main",
        ],
    },
)