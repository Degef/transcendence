FROM python:3.11

WORKDIR /app

COPY ./requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV DJANGO_SETTINGS_MODULE=transcendence.settings

CMD ["sh", "-c", "python3 manage.py makemigrations chat users pong && python3 manage.py migrate && daphne -b 0.0.0.0 -p 8000 transcendence.asgi:application"]
