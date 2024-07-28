
FROM alpine:3.18

RUN apk update && apk add --no-cache nginx openssl

RUN mkdir /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/pong_buddies.key \
    -out /etc/nginx/ssl/pong_buddies.crt  \
    -subj "/C=AE/L=Abu Dhabi/O=42/OU=42AbuDhabi MED/CN=tpetros.42.fr"

COPY ./nginx.conf /etc/nginx/http.d/nginx.conf

RUN chmod 644 /etc/nginx/http.d/nginx.conf

RUN chown -R nginx:nginx /etc/nginx/http.d

RUN sed -i 's/client_max_body_size 1m;/client_max_body_size 100m;/g' /etc/nginx/nginx.conf

EXPOSE 443

CMD ["nginx", "-g", "daemon off;"]