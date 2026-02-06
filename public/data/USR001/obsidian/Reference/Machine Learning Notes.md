# Machine Learning Notes

## Fundamentals

### Types of Learning
1. **Supervised Learning**: Labeled data
   - Classification
   - Regression
2. **Unsupervised Learning**: No labels
   - Clustering
   - Dimensionality reduction
3. **Reinforcement Learning**: Learn from rewards

### Key Concepts
- **Overfitting**: Model memorizes training data
- **Underfitting**: Model too simple to capture patterns
- **Bias-Variance Tradeoff**: Balance between simplicity and flexibility

## Neural Networks

### Architecture Components
- **Input Layer**: Raw features
- **Hidden Layers**: Learn representations
- **Output Layer**: Predictions
- **Activation Functions**: ReLU, Sigmoid, Tanh, Softmax

### Training
1. Forward propagation
2. Calculate loss
3. Backpropagation
4. Update weights (gradient descent)

### Regularization
- Dropout
- L1/L2 regularization
- Early stopping
- Data augmentation

## Transformers

### Attention Mechanism
"Attention Is All You Need" (Vaswani et al., 2017)

Key components:
- Query, Key, Value matrices
- Self-attention
- Multi-head attention
- Positional encoding

### Architecture
```
Input → Embedding → Positional Encoding
                        ↓
              [Multi-Head Attention]
                        ↓
              [Feed Forward Network]
                        ↓
                    Output
```

## Large Language Models

### Key Models
- GPT series (OpenAI)
- Claude (Anthropic)
- LLaMA (Meta)
- Gemini (Google)

### Prompting Techniques
- Zero-shot
- Few-shot
- Chain-of-thought
- System prompts

### Fine-tuning
- Full fine-tuning
- LoRA / QLoRA
- RLHF (Reinforcement Learning from Human Feedback)

## Evaluation Metrics

### Classification
- Accuracy
- Precision / Recall
- F1 Score
- AUC-ROC

### Regression
- MSE (Mean Squared Error)
- MAE (Mean Absolute Error)
- R² Score

### LLM Evaluation
- Perplexity
- BLEU / ROUGE
- Human evaluation
- Benchmark suites (MMLU, etc.)

---
Tags: #reference #ml #ai
