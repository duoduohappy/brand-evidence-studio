# Open-source components

Dependencies are installed from npm, with exact versions in package-lock.json. No unlicensed application repository has been copied.

| Component | GitHub | Usage | License |
|---|---|---|---|
| MiniSearch 7.2.0 | https://github.com/lucaong/minisearch | Search index and score ranking in core.mjs | MIT |
| LangGraphJS 1.7.5 | https://github.com/langchain-ai/langgraphjs | StateGraph node execution in core.mjs | MIT |
| Strapi 5.62.0 | https://github.com/strapi/strapi | Local CMS, SQLite, Document Service and drafts | Community/core MIT; enterprise portions separately licensed |
| Transformers.js 3.8.1 (optional) | https://github.com/huggingface/transformers.js | Local CPU model service | Apache-2.0 |
| Qwen2.5-0.5B-Instruct ONNX (optional download) | https://huggingface.co/onnx-community/Qwen2.5-0.5B-Instruct | Small local model inference | Refer to model card / Apache-2.0 upstream model license |

The project does not enable Strapi enterprise review workflows or its cloud service. The local draft viewer is project-authored and uses Strapi's Document Service; it is not the full Strapi Admin UI.

MiniSearch and LangGraphJS notices, and the Strapi license conditions, are reproduced in `licenses/`. Other packages retain their notices in the npm distribution. The model is downloaded separately, not redistributed in the source ZIP.
