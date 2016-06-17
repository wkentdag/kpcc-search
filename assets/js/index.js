const React = require('react')
const ReactDOM = require('react-dom')
const api = require('./api')

const SearchBar = React.createClass({
  render: function () {
    return (
      <div id='searchBar' >
        <h1>search kpcc for </h1>
        <form onSubmit={this.props.submit}>
          <input
            type='text'onChange={this.props.change}
            value={this.props.query}
          />
          <button>go</button>
        </form>
      </div>
    )
  }
})

const AudioSource = React.createClass({
  propTypes: {
    source: React.PropTypes.string.isRequired,
    ctx: React.PropTypes.object.isRequired
  },
  trim: function () {
    let ctx = this.props.ctx
    let req = new XMLHttpRequest()
    // req.open('GET', '/test.wav', true)
    //  FIXME: the audio api is missing CORS headers; comment out above and uncomment below to test real audio
    req.open('GET', this.props.source, true)
    req.responseType = 'arraybuffer'
    req.onload = function () {
      ctx.decodeAudioData(req.response, function (buffer) {
        let newLength = buffer.sampleRate * 10
        let trimmedBuffer = ctx.createBuffer(2, newLength, buffer.sampleRate) //  init empty 10second buffer

        //  copy over data h/t https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/createBufferSource
        for (let channel=0; channel<2; channel++) {
          let nowBuffering = trimmedBuffer.getChannelData(channel)
          let original = buffer.getChannelData(channel)
          for (let i=0; i<newLength; i++) {
            nowBuffering[i] = original[i]
          }
        }

        //  create blob url FIXME: what step am I missing to make this work?
        let blob = new Blob(trimmedBuffer, {type: 'audio/mp3'})
        let url = URL.createObjectURL(blob)
        this.setState({file: url})

        //  load trimmed track into the audiocontext
        let source = ctx.createBufferSource()
        source.buffer = trimmedBuffer
        source.connect(ctx.destination)
        this.setState({audioSource: source})
      }.bind(this))
    }.bind(this)
    req.send()
  },
  play: function () {
    this.state.audioSource.start()
  },
  componentDidMount: function() {
    this.trim()
  },
  getInitialState: function() {
    return {file: null}
  },
  render: function() {
    return (
      <div>
        <a onClick={this.play} href='#' >play</a>
        <a href={this.state.file} download>download</a>
      </div>
    )
  }
})

const Article = React.createClass({
  propTypes: {
    ctx: React.PropTypes.object.isRequired
  },
  render: function() {
    let audio = null
    if (this.props.audio) audio = (
      <AudioSource source={this.props.audio} ctx={this.props.ctx} />
    )

    return (
      <div className='article'>
        <a href={this.props.url}>
          <div dangerouslySetInnerHTML={this.props.image} />
        </a>
        <h2>{this.props.title}</h2>
        <p>{this.props.author}</p>
        <p>{this.props.teaser}</p>
        <div>{audio}</div>
      </div>
    )
  }
})

const ArticleList = React.createClass({
  propTypes: {
    ctx: React.PropTypes.object.isRequired,
    items: React.PropTypes.arrayOf(React.PropTypes.object)
  },

  render: function() {
    let ctx = this.props.ctx
    let createArticle = function(a) {
      return (
        <li key={a.id}>
          <Article
            title={a.title}
            author={a.byline}
            teaser={a.teaser}
            url={a.public_url}
            image={{__html: a.thumbnail}}
            audio={a.audio}
            ctx={ctx}
          />
        </li>
      )
    }

    return <ul className='article-list'>{this.props.items.map(createArticle)}</ul>
  }
})

const App = React.createClass({
  search: function() {
    api.search(this.state.query)
    .then(api.parse)
    .then(articles =>
      this.setState({articles: articles})
    )
  },
  handleSubmit: function(e) {
    e.preventDefault()
    this.search()
  },
  onChange: function(e) {
    this.setState({query: e.target.value})
    // api.search(e.target.value)
    // .then(api.parse)
    // .then(articles =>
    //   this.setState({articles: articles})
    // )
  },
  componentDidMount: function() {
    this.search()
  },
  getInitialState: function() {
    return {
      query: 'virgin galactic',
      articles: [],
      context: new AudioContext()
    }
  },
  render: function() {
    return (
      <div>
        <SearchBar
          query={this.state.query}
          submit={this.handleSubmit}
          change={this.onChange}
        />
        <ArticleList items={this.state.articles} ctx={this.state.context} />
      </div>
    )
  }
})

ReactDOM.render(
  <App />,
  document.getElementById('foo')
)
