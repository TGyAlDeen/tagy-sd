// Featured projects on the homepage. Keep to 3–6 for the best grid.
export interface Project {
	name: string;
	description: string;
	href: string;
	tags: string[];
	stars?: number;
}

export const PROJECTS: Project[] = [
	{
		name: "IDS-UNSW-NB15",
		description:
			"IoT intrusion-detection model combining neural networks and random forests on the UNSW-NB15 dataset.",
		href: "https://github.com/TGyAlDeen/IDS-UNSW-NB15",
		tags: ["Python", "Deep learning", "Security"],
		stars: 50,
	},
	{
		name: "B3ati",
		description:
			"Error-based SQL injection scanner built as a teaching tool for students entering information security.",
		href: "https://github.com/TGyAlDeen/B3ati",
		tags: ["Java", "Security"],
		stars: 3,
	},
	{
		name: "golang-DS",
		description: "Data structures and algorithms implemented from scratch in Go, with tests.",
		href: "https://github.com/TGyAlDeen/golang-DS",
		tags: ["Go", "Algorithms"],
	},
	{
		name: "mail-automation",
		description: "Native C++ tooling for automating high-volume mail workflows.",
		href: "https://github.com/TGyAlDeen/mail-automation",
		tags: ["C++", "Automation"],
		stars: 2,
	},
];
