#!/bin/sh

# Start backend server
cd /app && npm run start:server &

# Start nginx
nginx -g 'daemon off;'