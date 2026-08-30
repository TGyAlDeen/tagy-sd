// Tech stack shown on the homepage strip. Order matters.
export interface StackGroup {
	label: string;
	items: string[];
}

export const STACK: StackGroup[] = [
	{ label: "Data platform", items: ["Apache Iceberg", "Trino", "Parquet", "Apache Spark", "Kafka", "Airflow"] },
	{ label: "Languages", items: ["Python", "Go", "Java", "SQL", "TypeScript"] },
	{ label: "Cloud & infra", items: ["AWS", "Cloudflare", "Kubernetes", "Terraform", "Docker"] },
	{ label: "ML", items: ["PyTorch", "scikit-learn", "Deep learning"] },
];
