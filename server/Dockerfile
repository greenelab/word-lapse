FROM python:3.9

# RUN apk add build-base

WORKDIR /app

# install git-lfs, so we can pull lfs files
# also install letsencrypt, so we can update our SSL cert before running
RUN apt update && apt install git-lfs letsencrypt -y

# COPY ./requirements.txt /tmp/requirements.txt
COPY ./server_requirements.txt /tmp/server_requirements.txt
RUN pip install -r /tmp/server_requirements.txt

# track the short and full git commit from which this image was built
ARG SHORT_SHA=unspecified
LABEL git_commit=$SHORT_SHA
ARG COMMIT_SHA=unspecified
LABEL git_commit_full=$COMMIT_SHA

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

CMD ["/app/entrypoint.sh"]
