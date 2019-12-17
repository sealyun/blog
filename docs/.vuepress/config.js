module.exports = {
  "title": "sealyun | 博客",
  "description": "Something of everything, Everything of something",
  "dest": "public",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "nav": [
      {
        "text": "Home",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "TimeLine",
        "link": "/timeLine/",
        "icon": "reco-date"
      },
      {
        "text": "Contact",
        "icon": "reco-message",
        "items": [
          {
            "text": "GitHub",
            "link": "https://github.com/fanux",
            "icon": "reco-github"
          },
        ]
      }
    ],
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "Category"
      },
      "tag": {
        "location": 3,
        "text": "Tag"
      }
    },
    "logo": "https://sealyun.com/img/logo.png",
    "search": true,
    "searchMaxSuggestions": 10,
    "sidebar": "auto",
    "lastUpdated": "Last Updated",
    "author": "fanux",
    "record": "xxxx",
    "startYear": "2017"
  },
  "markdown": {
    "lineNumbers": true
  }
}
