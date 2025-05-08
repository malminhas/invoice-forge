FROM debian:bullseye

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 python3-pip python3-uno \
        libreoffice \
        unoconv \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . /app

RUN pip3 install --no-cache-dir --upgrade pip && \
    if [ -f requirements.txt ]; then pip3 install --no-cache-dir -r requirements.txt; fi

EXPOSE 8000

CMD libreoffice --headless --nologo --nofirststartwizard --accept="socket,host=127.0.0.1,port=2002;urp;" & \
    sleep 5 && \
    uvicorn invoice_generator_api:app --host 0.0.0.0 --port 8000
