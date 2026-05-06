
## Prerequisite
1) Python installed
2) NVIDIA API key — free at [NVIDIA NIM APIs](https://build.nvidia.com/explore/discover)
3) Claude Code CLI installed

## Setup

### Step 1 - Install liteLLM
```
pip install 'litellm[proxy]'
```

Step 2 - Clone this repo
```
git clone git@github.com:manueldezman/claude-template <yourProjectName>
```

### Step 3 - paste you nvidia API key into `.env.example`

### Step  4 - Rename enviomental variable 
```
mv .env.example .env
```

### Step 5 - load .env into path
```
set -a && source .env && set +a
```

 ### Step 6 - Start liteLLM proxy server

```
litellm --config litellm_config.yaml --port 4000

```

 ### Step 7 - Start claude

```
claude
```
 ### Step 8 - Add `.env` to `.gitignore file`

 ```
echo '.env' >> .gitignore
```

