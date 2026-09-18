# Plan Checklist

<!-- jarvis-gatekeeper runs this against plan.md, using stories.md and tech-spec.md as upstream artifacts. -->

## Blocking
- [ ] PLN-01 (auto) every US in stories.md appears in the Coverage table with ≥ 1 task — Evidence: plan.md Coverage table rows vs stories.md US list
- [ ] PLN-02 (auto) every task row names exactly one layer, backend|frontend|shared — Evidence: Tasks table `layer` column
- [ ] PLN-03 (auto) the `depends_on` graph is acyclic — Evidence: Tasks table `depends_on` column and the Dependency Order Mermaid graph
- [ ] PLN-04 (auto) every task has a non-empty done criteria and test expectations cell — Evidence: Tasks table `done criteria` / `test expectations` columns
- [ ] PLN-05 no task's estimated changed lines exceed `quality.max_task_loc` — Evidence: Tasks table `size` column vs `jarvis.config.yaml quality.max_task_loc`
- [ ] PLN-06 [ADDED] task order follows error registry & migrations → repository → service → handler → API client → UI — Evidence: Dependency Order section vs each task's layer/title
- [ ] PLN-07 [ADDED] every task names the files or areas it touches — Evidence: Tasks table `files/areas` column
- [ ] PLN-08 [ADDED] (auto) a `FIX-<finding-id>` task exists for every blocking finding when this plan follows a review loop-back — Evidence: Tasks table IDs vs review-report.md Findings table
- [ ] PLN-09 (auto) front matter is valid and `refs` names the artifacts actually read — Evidence: plan.md front matter `refs: [stories.md, tech-spec.md]`

## Advisory
- [ ] PLN-50 Notes section explains any non-obvious task split or sequencing — Evidence: plan.md Notes section
- [ ] PLN-51 [ADDED] task sizes are balanced; no single L task hides multiple unrelated concerns — Evidence: Tasks table `size` column
