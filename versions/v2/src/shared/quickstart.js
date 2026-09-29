import { t } from './i18n.js'

// Commands for the How-to-use section, as in the model card (SGLang first, as it recommends).
export const serveSnippets = [
  {
    id: 'sglang', label: 'SGLang',
    code: `# Prebuilt image
docker pull iquestlabworkspace/sglang-iquest-q1:cu130

# without MTP
MODEL_ROOT="$(hf download IQuestLab/IQuest-Q1 --quiet)" && \\
python -u -m sglang.launch_server \\
  --model-path "$MODEL_ROOT" \\
  --served-model-name IQuest-Q1 \\
  --tp-size 8 \\
  --dtype bfloat16 \\
  --attention-backend fa3 \\
  --mem-fraction-static 0.85 \\
  --disable-prefill-cuda-graph \\
  --enable-metrics \\
  --tool-call-parser iquest_q1 \\
  --reasoning-parser iquest_q1 \\
  --enable-torch-compile \\
  --load-format fastsafetensors \\
  --speculative-use-rejection-sampling

# with recursive MTP
MODEL_ROOT="$(hf download IQuestLab/IQuest-Q1 --quiet)" && \\
python -u -m sglang.launch_server \\
    --model-path "$MODEL_ROOT" \\
    --served-model-name IQuest-Q1 \\
    --tp-size 8 \\
    --dtype bfloat16 \\
    --attention-backend fa3 \\
    --mem-fraction-static 0.85 \\
    --disable-prefill-cuda-graph \\
    --enable-metrics \\
    --tool-call-parser iquest_q1 \\
    --reasoning-parser iquest_q1 \\
    --speculative-algorithm EAGLE \\
    --speculative-num-steps 5 \\
    --speculative-eagle-topk 1 \\
    --speculative-num-draft-tokens 6 \\
    --speculative-draft-model-path "$MODEL_ROOT/mtp" \\
    --enable-torch-compile \\
    --load-format fastsafetensors \\
    --speculative-use-rejection-sampling \\
    --speculative-draft-attention-backend fa3`,
  },
  {
    id: 'vllm', label: 'vLLM',
    code: `# Prebuilt image
docker pull iquestlabworkspace/vllm-iquest-q1:cu130

# without MTP
MODEL_ROOT="$(hf download IQuestLab/IQuest-Q1 --quiet)" && \\
vllm serve "$MODEL_ROOT" \\
  --served-model-name IQuest-Q1 \\
  --tensor-parallel-size 8 \\
  --reasoning-parser iquest_q1 \\
  --enable-auto-tool-choice \\
  --tool-call-parser iquest_q1

# with recursive MTP
MODEL_ROOT="$(hf download IQuestLab/IQuest-Q1 --quiet)" && \\
vllm serve "$MODEL_ROOT" \\
  --served-model-name IQuest-Q1 \\
  --tensor-parallel-size 8 \\
  --reasoning-parser iquest_q1 \\
  --enable-auto-tool-choice \\
  --tool-call-parser iquest_q1 \\
  --enable-prefix-caching \\
  --speculative-config '{
    "method": "eagle",
    "model": "'"$MODEL_ROOT"'/mtp",
    "num_speculative_tokens": 5,
    "draft_sample_method": "probabilistic",
    "rejection_sample_method": "standard",
    "enforce_eager": false
  }'`,
  },
  {
    id: 'api', label: t('Python API', 'Python 调用'),
    code: `# pip install openai
from openai import OpenAI

client = OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="sk-iquest")
response = client.chat.completions.create(
    model="IQuest-Q1",
    messages=[
        {"role": "user", "content": "Hello! Can you briefly introduce yourself?"},
    ],
    temperature=1.0,
    top_p=0.95,
)
print(response.choices[0].message.content)`,
  },
]

// Agent harnesses with a launch command in the model card. Both need a gateway that supports tool calling.
export const agentSnippets = [
  {
    id: 'claude-code', label: 'Claude Code',
    code: `# Recommended Claude Code version: 2.1.140
# The [1m] suffix is a client-side setting; it does not change the model's context limit.
export ANTHROPIC_MODEL="IQuest-Q1[1m]"
export ANTHROPIC_DEFAULT_SONNET_MODEL="IQuest-Q1[1m]"
export ANTHROPIC_DEFAULT_OPUS_MODEL="IQuest-Q1[1m]"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="IQuest-Q1[1m]"
export CLAUDE_CODE_SUBAGENT_MODEL="IQuest-Q1[1m]"
export CLAUDE_CODE_MAX_OUTPUT_TOKENS="131072"
export CLAUDE_AUTOCOMPACT_PCT_OVERRIDE="80"
export CLAUDE_CODE_AUTO_COMPACT_WINDOW="524288"
export API_TIMEOUT_MS="3000000"
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC="1"
export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS="1"
export ANTHROPIC_BASE_URL="http://example-iquest-q1-link"
export ANTHROPIC_AUTH_TOKEN="sk-iquest-q1"
claude --model IQuest-Q1`,
  },
  {
    id: 'codex', label: 'Codex CLI',
    note: t('This configuration turns off approval prompts and sandboxing, so run it in an isolated environment.', '该配置会关闭审批提示与沙箱，请在隔离环境中运行。'),
    code: `# Recommended Codex CLI version: 0.142.0
export OPENAI_API_KEY="sk-iquest-q1"
export MODEL_ID="IQuest-Q1"
# Add /v1 if required by your gateway's Responses endpoint.
export BASE_URL="http://example-iquest-q1-link"

(
  set -eu

  CONFIG_DIR="\${HOME}/.codex"
  mkdir -p -- "$CONFIG_DIR"
  CONFIG_DIR="$(cd -- "$CONFIG_DIR" && pwd -P)"

  # Back up existing files before replacing them.
  BACKUP_SUFFIX="$(date +%Y%m%d-%H%M%S)-$$"
  for FILE in config.toml model_catalog.json; do
    if [ -f "$CONFIG_DIR/$FILE" ]; then
      cp -p -- "$CONFIG_DIR/$FILE" "$CONFIG_DIR/$FILE.bak.$BACKUP_SUFFIX"
    fi
  done

  # This configuration disables approval prompts and sandboxing.
  cat > "$CONFIG_DIR/config.toml" <<EOF
model = "$MODEL_ID"
model_provider = "iquest"
approval_policy = "never"
sandbox_mode = "danger-full-access"
web_search = "disabled"
model_reasoning_summary = "detailed"
model_supports_reasoning_summaries = true
model_context_window = 524288
model_auto_compact_token_limit = 419430
model_auto_compact_token_limit_scope = "total"
tool_output_token_limit = 32768
model_catalog_json = "$CONFIG_DIR/model_catalog.json"

[model_providers.iquest]
name = "iquest"
base_url = "\${BASE_URL%/}"
wire_api = "responses"
env_key = "OPENAI_API_KEY"
supports_websockets = false
request_max_retries = 20
stream_max_retries = 20
stream_idle_timeout_ms = 600000

[model_providers.iquest.http_headers]
max-output-tokens = "131072"
EOF

  # The gateway must support the reasoning options and max-output-tokens header.
  cat > "$CONFIG_DIR/model_catalog.json" <<EOF
{
  "models": [
    {
      "slug": "$MODEL_ID",
      "display_name": "$MODEL_ID",
      "description": "IQuest-Q1 served through an API gateway.",
      "context_window": 524288,
      "input_modalities": ["text"],
      "base_instructions": "",
      "supported_reasoning_levels": [],
      "supports_reasoning_summaries": true,
      "supports_parallel_tool_calls": false,
      "shell_type": "default",
      "tool_mode": "default",
      "truncation_policy": {
        "mode": "tokens",
        "limit": 10000
      },
      "visibility": "list",
      "supported_in_api": true,
      "priority": 1,
      "support_verbosity": false,
      "experimental_supported_tools": []
    }
  ]
}
EOF

  codex --model "$MODEL_ID"
)`,
  },
]
