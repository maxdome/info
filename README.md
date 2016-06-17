# example

Use optionally the summarize function to add more information to the ```/info/summary```

```
const summarize = (summary) => {};
require('mxd-info')(config)(app, summarize);
```


# config

List of JSON paths of the config which will be disguised for the ```/info/config```

```
{
  "info": []
}
```


# routes

* ```/info``` and ```/info/summary```: response the summary with the most important information
* ```/info/config```: response the config
* ```/info/package```: response the ```package.json```
* ```/info/version```: response the version with the revision
