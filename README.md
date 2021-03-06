# Word Lapse

Explore how a word changes over time

<img src="https://raw.githubusercontent.com/greenelab/word-lapse/main/app/public/share-thumbnail.jpg?raw=true" width="300px">

[**✨ OPEN THE APP ✨**](https://greenelab.github.io/word-lapse/)

### How does it work?

Type in a word, and Word Lapse will show you how its associated words and frequency of use has changed over the years, and some other interesting details.
This information was generated by training multiple machine-learning models on 30+ million documents from [Pubtator Central](https://www.ncbi.nlm.nih.gov/research/pubtator/) and on 160+ thousand preprints from [bioRxiv](https://www.biorxiv.org/) and [medRxiv](https://www.medrxiv.org/).

Specifically, we used the Word2Vec natural-language-processing (NLP) technique, which represents words as dense (300 dimensional) vectors.
This model constructs these vectors by training a shallow neural network to accomplish the NLP task of predicting a word given their neighboring words.
Once the network has finished this task, these vectors contain information that allows a network to discern one word from the next and allows us to perform downstream tasks such as changepoint detection.

For more technical information about our approach and how we generated this data, [see this paper](https://greenelab.github.io/word_lapse_manuscript/).

### API

The API for this application can be used directly at `https://api-wl.greenelab.com/`.

[**See the API documentation**](https://api-wl.greenelab.com/docs)

### License

Everything in this repo -- including the code, data, submodules, and app -- is licensed under [BSD-3](https://opensource.org/licenses/BSD-3-Clause).
See [the license file](https://github.com/greenelab/word-lapse/blob/main/LICENSE)

### Development

To separate concerns and to make cloning and developing this repo easier, the model data (~26+ GB) for this project is stored in a separate submodule repo.
See [`SUBMODULES.md`](https://github.com/greenelab/word-lapse/blob/main/SUBMODULES.md) for more information.

The backend for this app (under `/server`) consists of three components:
- a RESTful API implemented in [FastAPI](https://fastapi.tiangolo.com/)
- a [Redis](https://redis.io/) in-memory cache with writethrough to disk
- a set of [RQ](https://python-rq.org/) workers that process word statistic lookups

The front-facing app (under `/app`) is made with React, bootstrapped with `create-react-app`.
