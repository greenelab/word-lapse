FROM python:3.9

# RUN apk add build-base

WORKDIR /app

# install git-lfs, so we can pull lfs files
# also install letsencrypt, so we can update our SSL cert before running
RUN apt update && apt install -y git-lfs letsencrypt redis-server

# set up redis a bit
RUN mkdir -p /redis/data
COPY ./services/redis/redis.conf /redis
VOLUME ["/redis/data"]

# we split up analysis and server reqs into two requirements files
# since the analysis ones take a while to install, but the server reqs don't.
# we use docker's layer caching to make editing the server reqs fast
COPY ./analysis_requirements.txt /tmp/analysis_requirements.txt
RUN pip install -r /tmp/analysis_requirements.txt

COPY ./server_requirements.txt /tmp/server_requirements.txt
RUN pip install -r /tmp/server_requirements.txt

# track the short and full git commit from which this image was built
ARG SHORT_SHA=unspecified
LABEL git_commit=$SHORT_SHA
ARG COMMIT_SHA=unspecified
LABEL git_commit_full=$COMMIT_SHA
ENV SHORT_SHA $SHORT_SHA
ENV COMMIT_SHA $COMMIT_SHA

COPY . /app

# ./data will contain several gb of models, so it's more efficient
# to have it as a persistent volume rather than baking it into the docker
# image, or populating it every time the container starts
# ---
# the entrypoint script will check if it needs to be populated when the
# container starts up
VOLUME [ "/app/data" ]

# also assign certs provisioned within the container to a volume
VOLUME [ "/etc/letsencrypt" ]

EXPOSE 80
EXPOSE 443
# redis port: needed for workers on other VMs to access redis
EXPOSE 6379

CMD ["/app/entrypoint.sh"]
