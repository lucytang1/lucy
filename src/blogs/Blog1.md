# App Release and OTA updates architecture for Expo applications.
@date: January 21, 2026

When developing a project, any feature or change that you put out, you want to test those changes, and ideally the pipeline that you set up for this should do two things:

- Not to degrade the Developer experience, what I mean by this is that the developer should not have to spend their time on things like building the app and sending it for testing.
- Testers should have easy access to the changes that were put out.

This blog assumes you have knowledge of [EAS builds](https://docs.expo.dev/build/introduction/), [OTA update in expo apps](https://docs.expo.dev/eas-update/getting-started/), [project fingerprint](https://expo.dev/blog/understanding-and-comparing-fingerprints-in-expo-apps), [GitHub actions](https://docs.github.com/en/actions)(or the CI you are using), and [EAS channels](https://docs.expo.dev/eas-update/how-it-works/).

This blog will only cover the Android platform, but you can incorporate for iOS just as easily.

## App Deployment Pattern

Before we start with the pipeline itself, it is necessary to decide on the pattern we will be following for the app releases and updates. Now, this is important in any project, but especially in a mobile app, because it is much harder to rollback changes than compared to something like a web app, and things like app store policies.

The pattern that we are going to be following is to maintain two channels: **Staging** and **Production**. Staging is what you use to test changes, give to testers, and Production is what goes to app stores.

Now there are other [deployment patterns](https://docs.expo.dev/eas-update/deployment-patterns/), but honestly, this one just got the job done. The flow in our deployment pattern will be like this:

- For Staging, every commit to main goes to the staging channel either as a new release or an OTA update. OTA updates will be deployed automatically to user devices, whereas new builds will be uploaded to Slack or a drive and will have to be installed manually
- For production, we will manually pick and send OTA updates or new releases.

![image.png](/blog_assets/Blog1/image.png)

The advantage of this pattern is that the pace of production and development is independent. This means you only do a production release or an OTA update when required, and staging changes happen on every commit.

## Implementation

For Staging:

On every main commit:

- Diff the project fingerprint of the current commit and the previous commit.
- If diff includes changes, create a new build in the staging channel.
- If diff includes no changes, send an OTA update in the staging channel.

For Production, the flow is a little different; the main branch will have a lot of commits, not all of which will require a new release or an OTA update, so:

For OTA updates:

- Create a new branch based on the topmost commit from the release that you are targeting.
- Cherry pick commits from main to be sent in an OTA update.
- Run the production CI action on this branch.

For releases:

- Run the production CI action on the commit that you want to target.

We will be using GitHub Actions as our CI, and to implement this kind of pipeline, we would need two actions: `staging-action.yml` and `production-action.yml`

Before we start with the implementation of our CI, it is important to understand how we will decide between when we can do an OTA update and when we require a new release. You can read the details about it here, but to explain in short, you look at the fingerprint(hash) of your project to determine whether the changes are compatible with the native layer of the app, so you can send an OTA update, or it is required to create a new build.

We will be writing a custom JavaScript action that does this for us, and it will be used in our two actions mentioned above.

```tsx
//index.ts
import { diffFingerprints, type Fingerprint } from "@expo/fingerprint";
import { getInput, setOutput } from '@actions/core';
import { getExecOutput, exec } from '@actions/exec';
import { context } from "@actions/github";

type Info = {
    previousCommit: string | undefined;
    currentCommit: string | undefined;
    previousFingerprint: Fingerprint | undefined;
    currentFingerprint: Fingerprint | undefined;
}

let info: Info = {
    previousCommit: undefined,
    currentCommit: undefined,
    previousFingerprint: undefined,
    currentFingerprint: undefined,
}

const previousCommitTag = getInput('previous-commit-tag');
const currentCommit = context.sha;
const profile = getInput('profile', {required: true}) as 'staging' | 'production';
const execute = async () => {
    const previousFingerprint = await getPreviousFingerPrint();
    const currentFingerprint = previousFingerprint && await getCurrentFingerPrint();
    const diff = currentFingerprint && await getDiff();
    return true;
}

async function getPreviousFingerPrint() {
    if (profile === 'staging') {
        const {stdout} = await getExecOutput(`git rev-parse @~`);
        info.previousCommit = stdout.trim();
    }else if (profile === 'production') {
        const {stdout, exitCode} = await getExecOutput(`git rev-parse ${previousCommitTag}`);
        if (exitCode !== 0) {
            return false;
        }
        info.previousCommit = stdout.trim();
    }
    await exec(`git checkout ${info.previousCommit}`);
    await exec('npm ci');
    const {stdout: fingerprint} = await getExecOutput(`npx @expo/fingerprint .`);
    info.previousFingerprint = JSON.parse(fingerprint.trim()) as Fingerprint;
    return true;
}

async function getCurrentFingerPrint() {
    info.currentCommit = currentCommit;
    await exec(`git checkout ${info.currentCommit}`);
    await exec('rm -rf node_modules');
    await exec('npm ci');
    const {stdout: fingerprint} = await getExecOutput(`npx @expo/fingerprint .`);
    info.currentFingerprint = JSON.parse(fingerprint.trim()) as Fingerprint;
    return true;
}

async function getDiff() {
    if (!info.previousFingerprint || !info.currentFingerprint) {
        return false;
    }
    const diff = diffFingerprints(info.currentFingerprint, info.previousFingerprint);

    setOutput('fingerprint-diff', diff);
}

execute();
```

The only thing this action does is that it diffs the fingerprint between two commits of a project and outputs that diff. It has two modes: Staging and Production. In staging, it diffs the fingerprint between the current commit and the just previous commit, while in production, it finds the topmost commit from the release you are targeting to diff against. Hence, when running in production, you have to pass one input to the action:

The git tag of the release that you are targeting, and make sure that the tag is always pointing to the latest commit in the release.

Now we can move to our CI actions.

```yaml
#staging-action.yml
name: Build App/Deploy OTA for Staging 

on:
    push:
        branches: [main]
        paths-ignore:
          - 'docs/**'
          - 'readme.md'
          - 'todo.md'

    workflow_dispatch:
      inputs:
        skipOTA:
          type: boolean
          description: Skip OTA deployment
          required: false
          default: false
          
jobs:
    deployOTA:
        name: Bundle and Deploy OTA for Android
        runs-on: ubuntu-latest
        outputs: 
          fingerprint-diff: ${{ steps.fingerprint.outputs.fingerprint-diff }}
        steps:
            - name: Checkout
              uses: actions/checkout@v4
              with:
                fetch-depth: 0

            - name: Check for EXPO token
              env: 
                EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
              run: bash scripts/check-expo-token.sh

            - name: Setup Node
              uses: actions/setup-node@v4
              with: 
                node-version-file: .nvmrc
                cache: 'npm'

            - name: Check Fingerprint and install dependencies
              id: fingerprint
              if: inputs.skipOTA == false
              uses: github-actions/expo-fingerprint@main
              with: 
                profile: staging
            #run your test and lint checks
            
            - name: Setup EAS
              uses: expo/expo-github-action@main
              if: ${{ steps.fingerprint.outputs.fingerprint-diff == '[]' && inputs.skipOTA == false }}
              with: 
                eas-version: latest
                token: ${{ secrets.EXPO_TOKEN }}
                packager: 'npm'
            
            - name: Deploy OTA
              if: ${{ steps.fingerprint.outputs.fingerprint-diff == '[]' && inputs.skipOTA == false }}
              run: eas update --channel staging --platform android

    BuildAndUploadAndroid:
      runs-on: ubuntu-latest
      name: Build Staging Android App
      needs: [deployOTA]
      if: ${{ (needs.deployOTA.outputs.fingerprint-diff != '[]' && github.repository == 'your-repo') || inputs.skipOTA == true }}
      steps:
        - name: Checkout 
          uses: actions/checkout@v4
          with:
            fetch-depth: 0

        - name: Setup Node
          uses: actions/setup-node@v4
          with: 
            node-version-file: .nvmrc
            cache: 'npm'
          
        - name: Setup EAS
          uses: expo/expo-github-action@main
          with:
            eas-version: latest
            token: ${{ secrets.EXPO_TOKEN }}
            packager: 'npm'
        
        - name: Setup Java
          uses: actions/setup-java@v4
          with: 
            distribution: 'temurin'
            java-version: '17'

        - name: Install Dependencies
          run: npm ci
          
         #Run your tests and lint checks

        - name: Create google-services.json
          env:
            ANDROID_GOOGLE_SERVICES_JSON_B64: ${{ secrets.ANDROID_GOOGLE_SERVICES_JSON_B64 }}
          run: bash scripts/create-google-services-file.sh

        - name: Build Preview Apk
          id: build-apk
          env:
            PLATFORM: android
            PROFILE: staging
          run: bash scripts/build-staging-artifact.sh

        # upload apks to your desired channel eg slack,drive etc.      
```

```yaml
#production-action.yml
name: Deploy OTA/Build and Submit to stores for production

on:
    workflow_dispatch:
        inputs:
            runtimeVersion:
                type: string
                description: Runtime Version in (x.x.x) format of the build you are targeting
                required: true
              

jobs:
    DeployOTA:
        name: Bundle and Deploy OTA for production
        runs-on: ubuntu-latest
        outputs:
          fingerprint-diff: ${{ steps.fingerprint.outputs.fingerprint-diff }}
        steps:
          - name: Checkout
            uses: actions/checkout@v4
            with:
              fetch-depth: 0

          - name: Check for EXPO token
            env: 
              EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
            run: bash scripts/check-expo-token.sh

          - name: Validate Runtime Version
            env: 
              RUNTIME_VERSION: ${{ inputs.runtimeVersion }}
            run: bash scripts/check-runtime-version.sh

          - name: Setup Node
            uses: actions/setup-node@v4
            with: 
              node-version-file: .nvmrc
              cache: 'npm'

          - name: Check Fingerprint and install dependencies
            id: fingerprint
            uses: github-actions/expo-fingerprint@main
            with: 
              profile: production
              previous-commit-tag: ${{ inputs.runtimeVersion }}
              
          #run your tests and lint checks
          
          - name: Setup EAS
            uses: expo/expo-github-action@main
            if: ${{ steps.fingerprint.outputs.fingerprint-diff == '[]' }}
            with: 
              eas-version: latest
              token: ${{ secrets.EXPO_TOKEN }}
              packager: 'npm'
          
          - name: Deploy OTA
            if: ${{ steps.fingerprint.outputs.fingerprint-diff == '[]' }}
            run: eas update --channel production --platform android

    BuildAndSubmit:
        name: Build and Submit to Android Play Store
        runs-on: ubuntu-latest
        needs: [DeployOTA]
        if: ${{  needs.DeployOTA.outputs.fingerprint-diff != '[]' && github.repository == 'your-repo'}}
        steps:
            - name: Checkout
              uses: actions/checkout@v4
              with:
                fetch-depth: 0
            
            - name: Check for EXPO token
              env: 
                EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
              run: bash scripts/check-expo-token.sh
  
            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                node-version-file: .nvmrc
                cache: 'npm'

            - name: Setup EAS
              uses: expo/expo-github-action@main
              with:
                eas-version: latest
                token: ${{ secrets.EXPO_TOKEN }}
                packager: 'npm'
                    
            - name: Setup Java
		          uses: actions/setup-java@v4
		          with: 
		            distribution: 'temurin'
		            java-version: '17'
		              
		        #run your tests and lint checks 
		            
            - name: Install Dependencies
              run: npm ci 
		            
		        - name: Create google-services.json
		          env:
		            ANDROID_GOOGLE_SERVICES_JSON_B64: ${{ secrets.ANDROID_GOOGLE_SERVICES_JSON_B64 }}
		          run: bash scripts/create-google-services-file.sh

            - name: Build Android App for production
              run: eas build --platform android --profile production --local --output=build.aab
              
            - name: Submit to Android Play Store
              run: eas submit --platform android --profile production --path build.aab
              
```

These actions are pretty self-explanatory, you checkout your code, load tokens, run your tests, set up tools like Java (Xcode if you are targeting iOS), node, EAS, and  install dependencies, and then based on output of the custom action we wrote before to diff fingerprint we decide wether to send an OTA update or do a new release cycle.

If you are using tools like Firebase or Expo notifications, you will also require a `google-services.json` file in the build step. To create this file during the job, encode your `google-services.json` to base64 string using [base64](https://linux.die.net/man/1/base64), upload it as a GitHub secret, and write a script that decodes this secret and creates the file back as JSON as done in the above actions.

Notice that we are using the `--local` flag in our build steps, which was a deliberate choice, by default EAS builds run on the Expo servers, by adding the `--local` flag the build happens on the CI runners, hence we can scale the build speeds with the runners and we are not using the EAS quotas.

You also need to make sure that your GitHub releases are consistent and tagged in a specified format like 1.X.Y and you use this tag to target OTA updates.

This blog builds up on the deployment pattern discussed [here](https://docs.expo.dev/eas-update/deployment-patterns/#persistent-staging-flow) and the [bluesky](https://github.com/bluesky-social/social-app) open source expo app's deployment architecture.