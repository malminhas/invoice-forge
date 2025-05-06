FROM python:3.11

WORKDIR /app

# Install LibreOffice, unoconv, and required dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libreoffice \
        libreoffice-java-common \
        default-jre-headless \
        unoconv \
    && apt-get clean && \
    rm -rf /var/lib/apt/lists/*

ENV HOME /tmp

COPY . /app

# Install Python dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

EXPOSE 8000

# Start LibreOffice listener and then the API
CMD libreoffice --headless --nologo --nofirststartwizard --accept="socket,host=127.0.0.1,port=2002;urp;" & \
    sleep 5 && \
    uvicorn invoice_generator_api:app --host 0.0.0.0 --port 8000
