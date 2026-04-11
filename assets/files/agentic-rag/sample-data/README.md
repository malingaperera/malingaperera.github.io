# Agentic RAG with AWS Sample Data

This folder contains the sample source documents used across posts 2 to 7 of the series.

Upload the `processed/` folder to S3 so the object keys keep the same prefix structure:

- `processed/hierarchical/...`
- `processed/semantic/...`

The sample data is grouped by the chunking strategy used later in the series:

- `processed/hierarchical/` contains structured operational documents such as runbooks, invoice event notes, and secret-rotation guidance.
- `processed/semantic/` contains more narrative documents such as flow notes, platform overviews, and onboarding material.

The dataset also includes `.metadata.json` sidecar files next to each markdown file. Those are used later in the retrieval-design post when testing metadata filters in Bedrock Knowledge Bases.

The later labs assume this dataset or something very similar to it.

Key questions this dataset is designed to answer:

- What retries happen after a payment failure?
- Which service publishes invoice events?
- How do we rotate the webhook signing secret?
- What happens after a payment failure, which events are published, and which service eventually sends the customer notification?
