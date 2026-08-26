# Content backlog: links to methods that no longer exist

Copy in Contentful — and the approach page's project text — links to method pages that are not
in the space any more. Every one of these 404s on d-labs.com today, so this is a pre-existing
content issue rather than something the Astro rewrite introduced. They are allowlisted in
`scripts/check-links.mjs` so `pnpm verify` stays green on the backlog and turns red on a _new_
break.

Fix by editing the link in Contentful (or in `content/pages/<locale>/approach.yml`) to point at a
method that exists, or by removing it.

| Broken link                                                                                 | Linked from                                              |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `/en/methods/business_process_modeling/`                                                    | `/en/blog/vuca_opportunities_and_risks/`                 |
| `/en/methods/online_training_creativity_techniques/`                                        | `/en/blog/how_d-labs_is_experiencing_the_corona_crisis/` |
| `/en/methods/online_training_home_office/`                                                  | `/en/blog/how_d-labs_is_experiencing_the_corona_crisis/` |
| `/en/methods/online_training_micorosoft-365_teams/`                                         | `/en/blog/how_d-labs_is_experiencing_the_corona_crisis/` |
| `/en/methods/online_training_user_research/`                                                | `/en/blog/how_d-labs_is_experiencing_the_corona_crisis/` |
| `/en/methods/online_training_visualization_training/`                                       | `/en/blog/how_d-labs_is_experiencing_the_corona_crisis/` |
| `/en/methods/qualifying_coaches/`                                                           | `/en/approach/`                                          |
| `/en/methods/qualitative_survey/`                                                           | `/en/approach/`                                          |
| `/en/methods/user_research/`                                                                | `/en/blog/vuca_opportunities_and_risks/`                 |
| `/en/methods/visualization_training/`                                                       | `/en/blog/communicate_with_visualizations/`              |
| `/en/services-and-methods/qualitative_survey/`                                              | `/en/blog/focusing_on_methods__shadowing/`               |
| `/journal/fehlerquellen_im_user_research_-_teil_1/`                                         | `/blog/methoden_im_fokus__shadowing/`                    |
| `/journal/von_interviews__fokusgruppen_und_co-creation_-_welche_methode_ist_die_richtige_/` | `/blog/methoden_im_fokus__co-creation/`                  |
| `/journal/wer_sind_lead_user_/`                                                             | `/blog/was_sind_end_user_und_power_user/`                |
| `/leistungen-und-methoden/qualitative_befragung/`                                           | `/blog/methoden_im_fokus__shadowing/`                    |
| `/methods/business_process_modelling_mit_greifbarem_material/`                              | `/blog/vuka_chancen_und_risiken/`                        |
| `/methods/online_schulung_home_office/`                                                     | `/blog/wie_die_dlabs_die_corona_krise_erlebt/`           |
| `/methods/online_schulung_kreativitatstechniken/`                                           | `/blog/wie_die_dlabs_die_corona_krise_erlebt/`           |
| `/methods/online_schulung_microsoft_365_teams/`                                             | `/blog/wie_die_dlabs_die_corona_krise_erlebt/`           |
| `/methods/online_schulung_use_research/`                                                    | `/blog/wie_die_dlabs_die_corona_krise_erlebt/`           |
| `/methods/online_schulung_visualisierungstraining/`                                         | `/blog/wie_die_dlabs_die_corona_krise_erlebt/`           |
| `/methods/qualifying_coaches/`                                                              | `/approach/`                                             |
| `/methods/qualitative_befragung/`                                                           | `/approach/`                                             |
| `/methods/quantitative_umfragen/`                                                           | `/methods/zielgruppenanalyse/`                           |
| `/methods/scrum/`                                                                           | `/blog/vuka_chancen_und_risiken/`                        |
| `/methods/user_research/`                                                                   | `/blog/vuka_chancen_und_risiken/`                        |
| `/methods/visualisierungstraining/`                                                         | `/blog/mit_visualisierungen_kommunizieren/`              |
