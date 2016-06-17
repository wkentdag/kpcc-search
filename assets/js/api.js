const request = require('superagent')
const _ = require('lodash')
const promisify = require('superagent-promise-plugin')
promisify.Promise = global.Promise

module.exports = {
  //  hit the kpcc article api
  //  @param text {str} - search parameter
  //  @returns {promise} - array of articles
  search (text) {
    return new Promise((resolve, reject) => {
      request
      .get('http://www.scpr.org/api/v3/articles')
      .query({query: text})
      .use(promisify)
      .then(res =>
        resolve(res.body.articles)
      )
      .catch(reject)
    })
  },

  //  strip and normalize articles from search()
  parse (articles) {
    return Promise.resolve(
      articles.map(a => {
        let article = _.pick(a, ['id', 'title', 'byline', 'teaser', 'url', 'thumbnail'])
        if (a.audio.length) article.audio = a.audio[0].url
        // if (!a.audio.length) article.audio = new AudioContext()
        // article.audio.createBuffer(2, 22050, 44100)
        return article
      })
    )
  }
}
