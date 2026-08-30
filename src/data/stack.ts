// Tech stack shown on the homepage strip. Order matters.
export interface StackGroup {
	label: string;
	items: string[];
}

export const STACK: StackGroup[] = [
	{ label: "Languages", items: ["Go", "Java / Spring Boot", "Kotlin", "TypeScript", "Python", "SQL"] },
	{ label: "Backend & systems", items: ["Microservices", "Event-driven (SQS, Pub/Sub)", "gRPC / REST", "Transactional outbox", "Redis", "OpenTelemetry"] },
	{ label: "Cloud & infra", items: ["AWS (Lambda, ECS, Aurora, Cognito)", "GCP (Cloud Run, Spanner, GKE)", "Terraform", "Kubernetes", "GitHub Actions", "Datadog"] },
	{ label: "Data & AI", items: ["PostgreSQL", "MySQL", "DynamoDB", "AWS Bedrock", "OpenSearch", "RAG / multi-agent"] },
];
