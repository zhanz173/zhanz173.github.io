---
title: Research & notes
description: Research on clinical EEG, diagnostic uncertainty, representation learning, and computational neuroscience by Zhenyu Zhang.
cssclasses:
  - portfolio-page
---

I study how machine learning can learn useful representations from brain signals and how clinical reports can provide supervision without losing the uncertainty behind a diagnosis.

## Thesis research

### Reader-Aware Modeling of Routine Clinical EEG

**MSc · Simon Fraser University · 2024–2026**

Routine EEG reports are a scalable source of supervision, but the labels also reflect how individual neurologists interpret and describe the recordings. My research examines diagnostic certainty in EEG-derived features, the information lost through binary labeling, and variation associated with the reader who authored the report.

I designed a reader-conditioned ordinal learning framework jointly modeling neurologist identity and diagnostic confidence, evaluated on **35,946 routine recordings** across multiple Fraser Health Authority hospital sites. The work includes foundation-model adaptation, calibration analysis, ordinal coherence metrics, and machine learning pipelines for more than 40,000 clinical recordings.

## Selected studies & technical notes

These posts document my side projects and experiments.

### Clinical uncertainty and supervision

[[Are uncertain EEG reports noisy labels|Are uncertain EEG reports noisy labels or borderline signals?]]

Frozen LaBraM and REVE representations suggest uncertain cases tend to sit closer to the normal–abnormal decision boundary and have more mixed neighborhoods. A smaller subset shows strong disagreement between the report and feature-space evidence.

---
---

### Representation learning for EEG

[[Auxiliary Losses Improve Clinical EEG Classification]]

Reconstruction and contrastive objectives improve classification across matched training runs. Follow-up analyses examine whether those gains survive replacement of the classifier head, and how negative sampling affects subject identifiability.

---

[[EEG compression ratio]]

An exploration of how reconstruction quality changes across frequency bands as compression increases, and what this might imply for reconstruction-based pretraining.

---

[[EEG classification better needs control studies]]

A comparison of pretrained EEG representations and spectral features asks what a classifier is actually learning, and why discrimination alone needs stronger controls before supporting disease-specific claims.

---
---

### MEG and individual differences

[[Religiosity in autistic and schizotypal traits]]

A study of 100 participants with contrasting autistic and schizotypal trait profiles. Associations between religiosity and resting alpha power differed by group, but the results did not establish a default-mode-network-specific effect or resolve its spectral basis.