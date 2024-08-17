#!/bin/bash
rsync -av --exclude 'node_modules' --exclude '.git' . root@www.ragfix.ai:/home/truthfulQaNode
