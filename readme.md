# Demo

Fully working website - https://vso-git.duckdns.org

# Goal

This project creates a webserver that can seamlessly proxy to any Azure DevOps git repository with easy URLS.

## Embracing GitOps

As DevOps grows and as GitOps grows as a portion of DevOps, there are increasingly more times when developers want to go to the source of truth git.

For workloads that currently take a webserver people need to build a bridge from git to the client app. This usually involves them running a git sync workflow and a webserver work flow, as well as setting up authentication for the webserver.

1. I built this to allow GitOps for those solutions requiring a website
    1. You no longer have to create another webserver to support legacy tools
        1. Worked great for Helm repositories for Kubernetes.
    1. You do not have to maintain more credentials, you can reuse Azure DevOps tokens
1. During bootstrapping you do not have infrastructure setup, it is much easier to reference the most recent version online.
1. This concept has already been validated by github itself(and third parties), I just built one for Azure DevOps
    1. https://raw.githubusercontent.com  (github.com)
    1. https://www.jsdelivr.com (third party)
    1. https://www.gitcdn.xyz/   (third party)

## But Doesn't azure DevOps already have REST api?

Yes it does, but it is not easy to use as a webserver.

1. It uses `get` parameters, meaning directory structure is not preserved.
    1. I cannot give a link and have it reference child files in the directory structure
        1. Prevents it from working for things like https://Helm.sh
1. It makes you type a dummy user name and access token as password
    1. Instead of access token as just username
1. Doesn't return correct mime-types
1. It is not in the same format as all the other github CDN's and therefore not as easy for people to understand
1. Azure has no caching, this project sets 120 second cache

### Azure urls vs vso-git urls
`https://empty:accessToken@dev.azure.com/oneeyedelf1/project3/_apis/git/repositories/vso_git_demo/items?path=/index.html&download=true&versionDescriptor.version=master&versionDescriptor.versionType=branch&api-version=5.0`

`https://vso-git.duckdns.org/accessToken/branch/oneeyedelf1/project3/vso_git_demo/master/index.html`

## Raw URL Format

Take your versionType (branch, commit, tag), organization , project, repository, branch/commit/tag and construct the url visit https://vso-git.duckdns.org for easy RAW URL constructor as well as fully functional implementation

`website + /accessToken/branch/organization/project/repository/branchName/'`
my base url is https://vso-git.duckdns.org and my current azure devops project is https://oneeyedelf1.visualstudio.com/project3/_git/vso_git_demo
\
* accessToken - lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja
* versionType - branch
* organization - oneeyedelf1
* project - project3
* repository - vso_git_demo
* branch - master

resultant url `https://vso-git.duckdns.org/lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja/branch/oneeyedelf1/project3/vso_git_demo/master/`

If you want a raw url, where all files are text and all directories include file lists add /raw after your website in the url `https://vso-git.duckdns.org/raw/lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja/branch/oneeyedelf1/project3/vso_git_demo/master/`


## urls for demo

**Demos do not work due to expired access token**

https://oneeyedelf1.visualstudio.com/project3/_git/vso_git_demo

https://dev.azure.com/oneeyedelf1/project3/_git/vso_git_demo?version=GC062a6a63cbfcd6be239e205aadf113c0348e1354


### 
personal access token for my repositories - `lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja`

# easy deploy

There is a container what more can you ask for.

```bash
docker build . -t knicknic/vso_git
docker run --rm -it -p "8080:8080" vso_git
```

# Files

App is a node.js express app

1. Readme.md - this file
1. index.js - the webserver
    1. index.js also contains the listing server webpage
1. rootpage.html - the root page that is served from the webserver
1. Various supporting files
    1. .dockerignore
    1. .gitignore
    1. Dockerfile
    1. package-lock.json
    1. package.json

# TODO

* [ ] Make websites prettier.
* [ ] Cleanup source.
* [ ] Remove any logging of passwords.
* [x] File bugs
    * get path contents wasn't working in source providers apis
        * https://github.com/MicrosoftDocs/vsts-rest-api-specs/issues/253
* [x] helm doesn't seem to work if params are url encoded (fixed)
    * https://github.com/helm/helm/issues/6048



# helm status

success with our raw urls

```bash
nick@oneeyedelf1-lap2:/mnt/c/Users/oneeyedelf1$ helm repo add t1 "https://vso-git.duckdns.org/lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja/branch/oneeyedelf1/project3/vso_git_demo/master/helm/"
"t1" has been added to your repositories
```

failure with Azure DevOps REST api

```bash
nick@oneeyedelf1-lap2:/mnt/c/Users/oneeyedelf1$ helm repo add t2 "https://empty:lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdja@dev.azure.com/oneeyedelf1/project3/_apis/git/repositories/vso_git_demo/items?download=true&versionDescriptor.version=master&versionDescriptor.versionType=branch&api-version=5.0&path=/helm"
WARNING: Deprecated index file format. Try 'helm repo update'
Error: Looks like "https://empty:lcwfr46dwkx6vkxv3jxwkjwfqedawf7a243ngnjoggytt37xgdjaa@dev.azure.com/oneeyedelf1/project3/_apis/git/repositories/vso_git_demo/items?download=true&versionDescriptor.version=master&versionDescriptor.versionType=branch&api-version=5.0&path=/helm" is not a valid chart repository or cannot be reached: json: cannot unmarshal string into Go value of type repo.unversionedEntry
```
