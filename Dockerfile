FROM sinet/nginx-node

# Copy Nginx Configuration File
COPY nginx.conf /etc/nginx/nginx.conf
COPY / /usr/share/nginx/html/haystack/

WORKDIR /usr/share/nginx/html/haystack/

RUN npm install -g bower \
	&& bower install --allow-root

CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80 443
