# Agentic RAG with AWS Sample Data

This folder contains the sample source documents used across posts 2 to 7 of the series.

Upload the `processed/` folder to S3 so the object keys keep the same prefix structure:

- `processed/payments/...`
- `processed/invoices/...`
- `processed/webhooks/...`
- `processed/shared/...`

The dataset also includes `.metadata.json` sidecar files next to each markdown file. Those are used later in the retrieval-design post when testing metadata filters in Bedrock Knowledge Bases.

The later labs assume this dataset or something very similar to it.

Key questions this dataset is designed to answer:

- What retries happen after a payment failure?
- Which service publishes invoice events?
- How do we rotate the webhook signing secret?
- What happens after a payment failure, which events are published, and which service eventually sends the customer notification?
