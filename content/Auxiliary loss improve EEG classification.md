#notes #classifcation #contrastive_learning

## Background

Clinical EEG classification is usually treated as a purely discriminative problem. But low signal-to-noise ratio, variation across patients and sessions, and uncertain clinical labels leave considerable room for shortcut learning. Label quality may also depend on the quality of the recording itself ([[Are uncertain EEG reports noisy labels]]) creating a confounding issue. This motivates muti-task learning beyond reproducing the available labels. Auxiliary objectives offer one way to explore this question. These objectives provide learning signals that do not depend on the clinical labels.

In EEG classification, auxiliary losses are implemented across two primary paradigms. 
- **Reconstruction Auxiliaries:** Jointly optimizes a reconstruction loss (MSE) alongside a classification cross-entropy loss. Different implementations includes [masked reconstruction](https://arxiv.org/pdf/2406.17086), [predictive reconstruction](https://arxiv.org/pdf/2608.00114), [contrastive learning](https://arxiv.org/pdf/2007.04871). 
- **Multi-Task Auxiliaries:** Applied self-constructed auxiliary tasks such as frequency-domain perturbation classification, channel mix-up identification etc. More often when secondary physiological metadata exist in the dataset, they are often added as auxiliary classification. 

The usual motivation is regularization, but a more interesting perspective regardless comes from [Castro et. al](https://www.nature.com/articles/s41467-020-17478-w). In a diagnostic setting, the underlying pathology contributes to the observed signal, while the model attempts to infer that pathology from the signal:
$$ Y^{*}\; \text{(pathology)} \longrightarrow X\; \text{(EEG)} \longrightarrow Y\text{(label)} $$
The clinical label available is a further observation of this process. It reflects a mixture recording interpretation, clinical context, and potentially influenced by recording quality. In a such anti-causal inference task ($Y^{*} \rightarrow X$),  if $P_{\theta}(X)$ is a noiseless approximation of $P(X \mid Y^{*})P(Y^{*})$, it provides a better representation for signal $X$. In the case of low-SNR EEG signal, this provides theoretical motivation for using generative pre-trained features rather than raw EEG.

From this perspective, the auxiliary loss may provide more than regularization effect on the gradient. A standard supervised model fits $Q_{\theta}(Y \mid X, U)$ over observable $\{X,Y\}$ only. Fitting an deep network via empirical risk minimization alone is not sufficient to guarantee learned representation is sufficient for $Y^{*}$([[EEG classification better needs control studies]]). .

Most straightforward way to enforce sufficiency is to reconstruct the data from encoder latent $X_{recon} = g_{\phi}(f_{\theta}(X))$. By forcing the redundancy with explicit reconstruction lower bound $I(X; Z) > I(X; X_{recon})$, the classifier model is encouraged to capture the footprint about $Y^{*}\rightarrow X$.

But reconstructing the entire recording may preserve too much redundance, as our final target is pathology prior $Y^{*}$ rather than the full EEG statistics $X$. This motivates using pretrained EEG representation as alternative target. For practical implementation one can use [contrastive learning](https://arxiv.org/abs/1905.06922) with CLIP style loss. This formulation gives us more control over what information to preserve by choosing [negative sampling strategies](https://arxiv.org/abs/1605.06336).  

## Setup

We selected 20-channel resting-state EEG recordings from 4,983 patients. Each patient contributes to one sample. The dataset consists of four different abnormality categories plus normal control (all four categories are negative), with roughly balanced sample size. Normal control matches proportional admission reason/hospital site/sex from the abnormal cohort with minimum age gaps between those strata. Each EEG received a label for four **mutually exclusive** abnormality subtypes: `focal epileptiform`, `generalized epileptiform`, `focal non-epileptiform`, and `generalized non-epileptiform`.

For each EEG, we previously extracted frozen LaBraM representations in 4-s moving windows without overlaps, detailed EEG feature extraction sees ([[Are uncertain EEG reports noisy labels]]). Since the classifier received per-channel z-score normalized EEG, the normalization constants were fed into the classifier as additional features. To match the 8-second window instances, we averaged the two adjacent windowed features.

Each model is trained from scratch using matched original initialization seeds, optimizer for 30 epochs under different auxiliary settings. All variants use 64-dimensional temporal latent, gated attention MIL, 8 random training windows and all evaluation windows per EEG, batch size 32, AdamW learning rate 0.001, weight decay 0.0001. Two auxiliary loss type were tested: 
- CE / Original classifier: baseline MIL classifier with only cross-entropy loss. Sigmoid BCE classifier is used for the model rather than softmax.
- CE + $\lambda$ * Huber: classifier with Huber reconstruction loss.
- CE +  $\lambda$ * CLIP: classifier with CLIP contrastive loss against pretrained LaBraM features.
	- (temporal): mixed 50% cross-subject windows and 50% within-EEG temporal windows as negatives pair. Negative windows require at least 16 seconds apart.
	- (windows):  cross-subject windows as negative only.
All comparisons use the same patient-disjoint splits and the best validation checkpoints for seeds 0/1/2. Macro AP averages the four abnormality types equally.

## Results

### Auxiliary loss improve classification performance

First the classification performance.  Both Huber(1) and temporal CLIP produce consistent classification gain over CE-only baseline across these three matched runs. To separate the benefit of better representation learned by encoder from better classifier training, we performed additional ablation study. Better mean features indicate information is more accessible with a linear probe. A disappearing gain after fresh attention suggests the benefits depends on the original pooling/head or better classifier head, rather than better learned representation. Although this alone does not establish whether auxiliary task preserves useful information or simply provides lower variance training gradient.

In both models the performance gains are not explained solely by better classifier optimization. Both auxiliary models retain a test-AP advantage over baseline after replacing the complete attention/classifier head. Temporal CLIP also gives a clear gain under simple mean pooling; Huber’s smaller mean-pooling gain makes results more uncertain;  the benefit appears to depend more on the learned MIL attention. 

Overall these results suggest auxiliary loss leads to better task representations, even if the auxiliary task is not related to the downstream application. The gain is consistent and statistical significant across different seeds especially for temporal CLIP model. 

![Readout comparison](readout_comparison.png)

| Model                    | Readout                            | Mean AP gain (pp) | Seeds 0 / 1 / 2 (pp) | Patient bootstrap 95% CI (pp) |
| ------------------------ | ---------------------------------- | ----------------- | -------------------- | ----------------------------- |
| CE + Huber (1)           | Original classifier                | +3.15             | +3.93, +3.63, +1.89  | [+1.48, +4.70]                |
| CE + Huber (1)           | Mean + scale, fresh linear         | +0.97             | +0.59, +1.03, +1.30  | [-0.54, +2.42]                |
| CE + Huber (1)           | Fresh attention/classifier + scale | +2.37             | +2.90, +4.05, +0.16  | [+0.42, +4.13]                |
| CE + temporal CLIP (0.1) | Original classifier                | +4.93             | +5.44, +6.03, +3.32  | [+2.78, +6.81]                |
| CE + temporal CLIP (0.1) | Mean + scale, fresh linear         | +3.58             | +2.94, +4.39, +3.41  | [+1.57, +5.33]                |
| CE + temporal CLIP (0.1) | Fresh attention/classifier + scale | +4.42             | +3.51, +6.88, +2.88  | [+2.05, +6.57]                |

*table guide:* Values are mean test AP over three training seeds. Fresh MIL initialization is selected from two matched starts using validation AP only. Mean (pooling) removes the original attention head, used to evaluate the learned representation directly; fresh MIL re-trains learned attention, LayerNorm, classifier, and amplitude head. Temporal CLIP’s gain survives both mean pooling and a fresh attention head, suggesting that useful information is more accessible in its encoder features. Huber’s result is less clear under mean pooling.

### Feature geometry and similarity

Comparing the feature similarity learned by each model, temporal CLIP model learned progressively different representation deeper into the encoder layers. But the final representation shows much higher similarity. This difference is also demonstrated by the higher latent occupancy in the temporal CLIP model, suggesting more redundant information kept by the encoder. 

We further measured the latent separation with top 10 nearest neighbor purity. Higher information capacity does not translate into cleaner class clustering or better feature separation as we hoped. At the classifier input layer, temporal CLIP achieves 0.418 purity averaged across three seeds, compared to 0.412 for Huber and 0.395 for baseline. The difference is small and does not establish statistical significance.

Geometry representation was measure by PCA. The first two principle components retain 78% variance for CE baseline, 73% variance for CE + Huber and 44% variance for temporal CLIP, although none of the three models show clear separation in the first two PC space. Temporal CLIP introduces visibly wider scatter, but does not improve separation.

This result was not entirely unexpected. Inter-subject variance is a well-documented problem in EEG study, and it poses a major challenge for BCI research. The generative pretraining strategy inevitably incentivizes LaBraM model to capture subject-level features in the representation space. 

![Feature geometry](feature_geometry.png)
*Figure guide:* Blue dots mark the actual layerwise CKA outputs. Each feature map is averaged over time, then equally over windows in an EEG. Effective rank is used to measure the occupied feature directions. Neighbors use centered cosine distance, with top-10 closet samples by distance. Encoder mean is this equal-weighted 8-windows (bag) mean at the final Latent. Classifier input uses learned gated attention instead of an equal-weighted window mean.
 

![Feature projection](feature_pca.png)
*Figure guide:* Each model is projected into its own PCA coordinates; position and axes cannot be compared interchangeable.  Each feature map is pooled by learned attention weight. These panels show substantial class overlap within each space; temporal CLIP (0.1) model retains the most feature variances, followed by Huber (1). 


## Conclusion 

This limited study examined the benefits of auxiliary loss in the context of clinical EEG classification. The consistent improvement in performance and no obvious downside effect deserves further investigation. 

However, whether generative features are the right reconstruction target needs more consideration. In many downstream tasks, retaining within-subject features could pose a significant generalization risk. On the other end, discarding all within-subject information risks to remove group differences that are necessary for classifications. 

The current study chose an equal weight between within-subject and between-subject negative samples for simplicity. The within- negative samples put slightly more emphasis on within-subject variation and less on recording structure. Whether subject-specific nuisance information can be isolated from useful persistent pathology remains unclear. Likewise, better strategy for negative sampling may exist for different tasks. 


## Ablation 

### CLIP alignment comparison

We benchmarked cross-participant alignment strategy for both [REVE](https://braindecode.org/stable/generated/braindecode.models.REVE.html) and [LaBraM](https://braindecode.org/stable/generated/braindecode.models.Labram.html) features, extracted under the same condition. In both cases the negative pairs were sampled from different participants.

Window-level REVE at λ=0.1 is the strongest among the cross-subject-only conditions by mean macro AP. It improves test AP over Huber λ=1 by 1.24 percentage points, with positive paired differences in all three seeds. EEG-level CLIP falls below Huber; window-level alignment consistently improves over EEG-level alignment. 

λ=0.1 has higher mean AP than λ=1 for all four CLIP combinations. These observations suggest the stronger auxiliary weighting is less helpful within the 30-epoch budget.

| Condition       | λ   | Test AP ± SD $\uparrow$ | Test ROC-AUC $\uparrow$ | Test BCE ↓ |
| --------------- | --- | ----------------------- | ----------------------- | ---------- |
| Supervised      | 0   | 0.5707 ± 0.0416         | 0.7848                  | 0.4582     |
| Huber           | 1   | 0.6022 ± 0.0363         | 0.8028                  | 0.4483     |
| (EEG) LaBraM    | 0.1 | 0.5829 ± 0.0554         | 0.7830                  | 0.4587     |
| (EEG) LaBraM    | 1   | 0.5623 ± 0.0370         | 0.7739                  | 0.4683     |
| (EEG) REVE      | 0.1 | 0.5813 ± 0.0451         | 0.7834                  | 0.4692     |
| (EEG) REVE      | 1   | 0.5596 ± 0.0271         | 0.7705                  | 0.4776     |
| (Window) LaBraM | 0.1 | 0.6054 ± 0.0264         | 0.7972                  | 0.4473     |
| (Window) LaBraM | 1   | 0.5930 ± 0.0275         | 0.7884                  | 0.4569     |
| (Window) REVE   | 0.1 | 0.6145 ± 0.0284         | 0.8029                  | 0.4462     |
| (Window) REVE   | 1   | 0.5898 ± 0.0191         | 0.7873                  | 0.4573     |

*Table guide:* EEG-level sampling aligns current windows with recording-level features; window-level sampling aligns with current window features. Window-level alignment shows more consistent improvement over CE baseline. 

| Condition     | focal_epi | gen_epi | focal_nonepi | gen_nonepi |
| ------------- | --------- | ------- | ------------ | ---------- |
| Supervised    | 0.5291    | 0.6217  | 0.4882       | 0.6436     |
| Huber         | 0.5669    | 0.6794  | 0.5165       | 0.6458     |
| EEG LaBraM    | 0.5311    | 0.6313  | 0.5029       | 0.6664     |
| EEG REVE      | 0.5237    | 0.6279  | 0.5131       | 0.6607     |
| Window LaBraM | 0.5473    | 0.6689  | 0.5142       | 0.6913     |
| Window REVE   | 0.5716    | 0.6799  | 0.5258       | 0.6809     |

*Table guide:* REVE window improves mean AP for all four types over Huber, but most of the macro gain comes from generalized non-epileptiform AP: +3.51 pp, versus +0.46/+0.05/+0.93 pp for focal epileptiform, generalized epileptiform and focal non-epileptiform. LaBraM window improves generalized non-epileptiform AP strongly (+4.55 pp) but loses AP in the other three types.

### Negative sampling comparison 

We compared mixed cross-subject and within-EEG temporal negatives at $\lambda$=0.1. Within-EEG negatives require at least 16 seconds between windows. Positive pair is exact time matched features. 

| Condition                             | Test AP ± seed SD | Test ROC-AUC | Test BCE |
| ------------------------------------- | ----------------- | ------------ | -------- |
| Supervised                            | 0.5707 ± 0.0416   | 0.7848       | 0.4582   |
| Huber ($\lambda=1$)                   | 0.6022 ± 0.0363   | 0.8028       | 0.4483   |
| LaBraM cross-subject ($\lambda=0.1$)  | 0.6054 ± 0.0264   | 0.7972       | 0.4473   |
| LaBraM mixed temporal ($\lambda=0.1$) | 0.6200 ± 0.0310   | 0.8080       | 0.4409   |
| REVE cross-subject ($\lambda=0.1$)    | 0.6145 ± 0.0284   | 0.8029       | 0.4462   |
| REVE mixed temporal ($\lambda=0.1$)   | 0.6176 ± 0.0205   | 0.8043       | 0.4434   |

*Table guide:* LaBraM improves mean test AP and ROC-AUC, and lowers mean BCE. Test AP gains are positive in all three seeds. REVE has a small mean test AP gain with mixed seed differences. The results show a more consistent benefit for LaBraM in our classification setting.

| model                                 | Within-subject variance fraction | Adjacent window change | Same recording retrieval |
| ------------------------------------- | -------------------------------- | ---------------------- | ------------------------ |
| LaBraM cross-subject ($\lambda=0.1$)  | 0.2516                           | 0.3645                 | 0.5639                   |
| LaBraM mixed temporal ($\lambda=0.1$) | 0.2619                           | 0.3792                 | 0.5343                   |
| REVE cross-subject ($\lambda=0.1$)    | 0.2471                           | 0.3556                 | 0.6390                   |
| REVE mixed temporal ($\lambda=0.1$)   | 0.2754                           | 0.3963                 | 0.5735                   |

*Table guide:* Within-subject variance fraction is the variance retained after remove recording mean for each window. Adjacent window change is mean squared change between consecutive accepted 8s windows normalized by total recording variance.  Within-subject negative samples prompts within-subject variance and suppress between-subject variance modestly.  