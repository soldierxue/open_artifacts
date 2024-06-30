FROM python:3.10

# Set working directory
WORKDIR /app

RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    ca-certificates \
    libglib2.0-0 \
    libxext6 \
    libsm6 \
    libxrender1 \
    git \
    graphviz \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages using pip
RUN pip install --no-cache-dir numpy pandas scipy scikit-learn matplotlib seaborn jupyter_client diagrams requests bs4 requests

# Set default command
CMD ["python"]