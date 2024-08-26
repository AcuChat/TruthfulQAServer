#!/bin/bash
rsync -av --exclude 'node_modules' --exclude '.git' . root@api-dev.ragfix.ai:/home/truthfulQaNode
