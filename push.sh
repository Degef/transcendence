# !/bin/bash

USER_NAME=$(git config user.name)

read -p "Enter your commit message: " COMMIT_MESSAGE

DATE=$(date +"%Y-%m-%d %H:%M:%S")

git add .

git commit -m "$COMMIT_MESSAGE - Committed by $USER_NAME on $DATE"

git push
