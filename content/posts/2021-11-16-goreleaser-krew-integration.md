---
title: "Publishing Krew plugin manifests with GoReleaser"
description: "GoReleaser v1.0.0 introduced a Krew integration to generate and publish Krew Plugin Manifests. This is a walkthrough of using GoReleaser to publish kubectl plugin manifest to a custom plugin index."
date: 2021-11-16T17:30:00+08:00
tags: [goreleaser, kubectl-plugin, kubernetes]
---

[GoReleaser v1.0.0](https://carlosbecker.com/posts/goreleaser-v1/) was just released this week & I wanted to try out their new [Krew integration](https://goreleaser.com/customization/krew/) to see if I can use it in my GitHub Actions workflow to publish new versions of my kubectl plugins to the [official Krew index](https://github.com/kubernetes-sigs/krew-index).

Unfortunately this integration only works for publishing to [custom plugin indexes](https://krew.sigs.k8s.io/docs/user-guide/custom-indexes), so we still have to stick with the [rajatjindal/krew-release-bot](https://github.com/rajatjindal/krew-release-bot) GitHub action for now.[^1] 😭

However I always wanted to try hosting a custom plugin index, so this finally gave me enough incentive to commit into doing it & share the process of how one would use GoReleaser to publish kubectl plugins to a custom plugin index.

## Hosting a custom plugin index

A custom plugin index is essentially a Git repository that follows a certain directory structure & contains a bunch of Krew plugin manifests.

> A [Krew plugin manifest](https://krew.sigs.k8s.io/docs/developer-guide/plugin-manifest/) is a YAML file that describes the plugin, how it can be downloaded, and how it is installed on a machine.

We can refer to the Krew docs on ["Hosting Custom Plugin Indexes"](https://krew.sigs.k8s.io/docs/developer-guide/custom-indexes/) for details on how to host one.

## Obtaining a GitHub Personal Access Token {id="obtaining-a-github-personal-access-token"}

In order for GoReleaser to push changes to our custom plugin index (a GitHub repository) via the GitHub API, we need to prepare a Personal Access Token (PAT) with `repo` permissions.

We can refer to the GitHub docs on ["Creating a personal access token"](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) on how to do this.

To be honest, I'm not too thrilled with doing this with PATs as it grants GoReleaser access to all my repos when all I need is to only grant it commit access to the [tohjustin/kubectl-plugins](https://github.com/tohjustin/kubectl-plugins) repository. At least based on the [project owner's response in this GitHub issue](https://github.com/goreleaser/goreleaser/issues/2027#issuecomment-778330276), it seems like he is open to looking into using [deploy keys](https://docs.github.com/en/developers/overview/managing-deploy-keys#deploy-keys) to address this issue for GoReleaser v2. 😅

## Converting a Krew plugin manifest to GoReleaser configuration

Since pretty much all folks who has published a kubectl plugin to the official Krew index are familiar with what a Krew plugin manifest is, I thought it would be more interesting to do this backwards by converting an existing manifest into a GoReleaser configuration instead of writing one from scratch.

Here's an example of how a manifest looks like:

```yaml
# https://github.com/kubernetes-sigs/krew-index/blob/master/plugins/lineage.yaml
apiVersion: "krew.googlecontainertools.github.com/v1alpha2"
kind: "Plugin"
metadata:
  name: "lineage"
spec:
  version: "v0.4.2"
  homepage: "https://github.com/tohjustin/kube-lineage"
  shortDescription: "Display all dependent resources or resource dependencies"
  description: |
    This plugin prints a table of dependencies or dependents of the specified
    resource.
  caveats: |
    The tool only shows dependencies or dependents among the resources you have
    access to. So for restricted users, the result may be incomplete.
  platforms:
  - selector:
      matchLabels:
        os: "darwin"
        arch: "amd64"
    uri: "https://github.com/tohjustin/kube-lineage/releases/download/v0.4.2/kube-lineage_darwin_amd64.tar.gz"
    sha256: "75dd85e8f91a84e37a0e36f00697e6cadb864143b825f808ff540a2b93a2612b"
    bin: "kube-lineage"
# ...
```

First we use the manifest template below that we derive by replacing those values that we need to copy over to the GoReleaser configuration with template variables (`$PLUGIN_NAME`, `$HOME_PAGE` etc.):

```yaml
apiVersion: "krew.googlecontainertools.github.com/v1alpha2"
kind: "Plugin"
metadata:
  name: $PLUGIN_NAME
spec:
  homepage: $HOME_PAGE
  shortDescription: $SHORT_DESCRIPTION
  description: $DESCRIPTION
  caveats: $CAVEATS
  platforms:
  - selector:
      matchLabels:
        os: "darwin"
        arch: "amd64"
    uri: https://github.com/$KREW_INDEX_OWNER/$KREW_INDEX_REPO_NAME/releases/download/v0.4.2/kube-lineage_darwin_amd64.tar.gz
    sha256: "75dd85e8f91a84e37a0e36f00697e6cadb864143b825f808ff540a2b93a2612b"
    bin: "kube-lineage"
# ...
```

Then based on the configuration template below, we copy the values from the original manifest to our GoReleaser configuration file:

```yaml
# .goreleaser.yaml
krews:
  - name: $PLUGIN_NAME
    index:
      owner: $KREW_INDEX_OWNER
      name: $KREW_INDEX_REPO_NAME
      token: "{{ .Env.KREW_GITHUB_TOKEN }}"
    url_template: https://github.com/$KREW_INDEX_OWNER/$KREW_INDEX_REPO_NAME/releases/download/{{ .Tag }}/{{ .ArtifactName }}
    commit_msg_template: "Krew plugin update for {{ .ProjectName }} version {{ .Tag }}"
    homepage: $HOME_PAGE
    short_description: $SHORT_DESCRIPTION
    description: $DESCRIPTION
    caveats: $CAVEATS
# ...
```

Here's what the end result would look like:

```yaml
# https://github.com/tohjustin/kube-lineage/blob/v0.4.2/.goreleaser.yaml#L54-L70
# ...
krews:
  - name: "lineage"
    index:
      owner: "tohjustin"
      name: "kubectl-plugins"
      token: "{{ .Env.KREW_GITHUB_TOKEN }}"
    url_template: "https://github.com/tohjustin/kube-lineage/releases/download/{{ .Tag }}/{{ .ArtifactName }}"
    commit_msg_template: "Krew plugin update for {{ .ProjectName }} version {{ .Tag }}"
    homepage: "https://github.com/tohjustin/kube-lineage"
    short_description: "Display all dependent resources or resource dependencies"
    description: |
      This plugin prints a table of dependencies or dependents of the specified
      resource.
    caveats: |
      The tool only shows dependencies or dependents among the resources you have
      access to. So for restricted users, the result may be incomplete.
```

There are a lot other available options that we can configure for this Krew integration, we can refer to the [official GoReleaser docs](https://goreleaser.com/customization/krew/) to find out more about them! 🙂

## Configuring GitHub Actions workflow

I have automated the publishing of kubectl plugins with GoReleaser via a GitHub Actions workflow, so we need to add the PAT obtained in the [earlier step]({{< relref "posts/2021-11-16-goreleaser-krew-integration.md#obtaining-a-github-personal-access-token" >}}) as a secret in our repository. We can do this on GitHub via the repository's **Settings** page under the **Secrets** section:

![repository-secret-page-on-github](/images/2021-11-15-repository-secret.png)

We can see from the image above that I've set the token as a secret named `KREW_GITHUB_TOKEN` which was referenced in our [GoReleaser configuration](https://github.com/tohjustin/kube-lineage/blob/v0.4.2/.goreleaser.yaml#L54-L70) earlier on.

Next we need to update our [GitHub Actions workflow definition](https://github.com/tohjustin/kube-lineage/blob/v0.4.2/.github/workflows/release.yaml#L66-L70) to set the `KREW_GITHUB_TOKEN` environment variable so that GoReleaser can access it:

```yaml
# https://github.com/tohjustin/kube-lineage/blob/v0.4.2/.github/workflows/release.yaml#L66-L70
# ...
      - name: Release
        run: make release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          KREW_GITHUB_TOKEN: ${{ secrets.KREW_GITHUB_TOKEN }}
# ...
```

Finally our GoReleaser configuration is ready to publish our Krew plugin manifest to a custom plugin index!

After a successful workflow run, we should see a Git commit created by GoReleaser in the repository of the custom plugin index:

![git-commit-created-by-goreleaser](/images/2021-11-15-goreleaser-commit.png)

[^1]: GoReleaser publishes Krew plugin manifests by pushing Git commits directly to the plugin index's Git repository, this doesn't work for the official Krew index as the established process requires the publishing to be [done via GitHub pull requests](https://krew.sigs.k8s.io/docs/developer-guide/release/updating-plugins/) for review & approval purposes.
