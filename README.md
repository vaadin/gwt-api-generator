# gwt-api-generator

gwt-api-generator is a tool that produces GWT Java APIs for JavaScript libraries provided as input, assuming their APIs are decorated with JSDoc annotations.

Currently the generator only supports Web Components written in Polymer 1.0 syntax. Support for other type of JavaScript sources might be added in the future.

Original motivation behind the project was to provide GWT community an easy access to the elements in [Vaadin Elements](https://github.com/vaadin/vaadin-core-elements) collection.

_Notice:_ Vaadin transferred the ownership of this library to the community
by 20 Apr 2017, thus Vaadin no longer provides support or does active development on it.

## Installation and Usage

- Installation
```shell
$ npm install -g vaadin/gwt-api-generator
```
> If you've installed node and npm using `sudo`, installing packages globally will also require you to use `sudo`. See [http://givan.se/do-not-sudo-npm/](http://givan.se/do-not-sudo-npm/) how to remedy the situation.

- Generating java code for bower packages installed in your bower_components folder

  ```shell
  $ bower install my-web-component
  $ gwt-api-generator
  ```
- Generating java code for a complete library

  ```shell
  $ gwt-api-generator --package=PolymerElements/paper-elements
  ```
- Generating resources with a custom groupId and artifactId

  ```shell
  $ gwt-api-generator --package=PolymerElements/paper-elements \
                    --groupId=com.foo --artifactId=bar
  ```
- Generating resources for a non-maven structure

  ```shell
  $ gwt-api-generator --package=PolymerElements/paper-elements
                      --javaDir=src --resourcesDir=src
  ```
- Generating maven `pom.xml` file and packaging the result as a ready-to-use `.jar` file

  ```shell
  $ gwt-api-generator --package=PolymerElements/paper-elements --pom
  $ mvn package
  ```

## Pre-built packages

### Paper, Iron, App, Platinum, and Vaadin-Core elements

Vaadin officially maintains and supports a pre-built package deployed at Maven Central repository containing all the resources needed for using Polymer
[paper-elements](https://elements.polymer-project.org/browse?package=paper-elements),
[app-elements](https://elements.polymer-project.org/browse?package=app-elements),
[platinum-elements](https://elements.polymer-project.org/browse?package=platinum-elements),
[iron-elements](https://elements.polymer-project.org/browse?package=iron-elements) and
[vaadin-core-elements](https://vaadin.com/elements)
in a GWT application.

Build script, demo and usage instructions for the project are available [here](https://github.com/vaadin/gwt-polymer-elements).

You also might see all these components in action using the [Show Case](http://manolo.github.io/gwt-polymer-elements/demo/) application

## Using your own Web Components in your App.

Whether you need a 3 party element not included in the prebuilt packages or you want to maintain your own set of components, you can setup your maven project to automatically generate Java interfaces during the build process just following the next steps.

1. Create a `package.json` with the `gwt-api-generator` package dependency:

        {
          "name": "my-app",
          "description": "my-app",
          "version": "1.0",
          "license": "my-prefered-license",
          "dependencies": {
            "gwt-api-generator": "vaadin/gwt-api-generator"
          }
        }


2. Create a `bower.json` to add all 3rd party elements your application depends on, in this example we add a library for binding data to pouchdb/couchdb databases:

        {
          "name": "my-app",
          "description": "my-app",
          "main": "",
          "license": "my-prefered-license",
          "dependencies": {
            "vaadin-pouchdb": "manolo/vaadin-pouchdb"
          }
        }

3. Make your maven build script to automatically install node, npm and bower, download all elements, generate java classes and bundle static stuff in your package:

        <!-- install node, npm, bower, and your components -->
        <plugin>
          <groupId>com.github.eirslett</groupId>
          <artifactId>frontend-maven-plugin</artifactId>
          <executions>
            <execution>
              <id>install node and npm</id>
              <phase>generate-resources</phase>
              <goals>
                <goal>install-node-and-npm</goal>
              </goals>
              <configuration>
                <nodeVersion>v6.2.0</nodeVersion>
              </configuration>
            </execution>
            <execution>
              <id>npm install</id>
              <goals>
                <goal>npm</goal>
              </goals>
              <configuration>
                <arguments>install</arguments>
              </configuration>
            </execution>
            <execution>
              <id>bower install</id>
              <goals>
                <goal>bower</goal>
              </goals>
              <configuration>
                <arguments>install</arguments>
              </configuration>
            </execution>
          </executions>
        </plugin>

        <!-- Generate java code for all web downloaded components -->
        <plugin>
          <artifactId>maven-antrun-plugin</artifactId>
          <version>1.7</version>
          <executions>
            <execution>
              <phase>generate-resources</phase>
              <configuration>
                <target>
                  <exec
                    dir="${project.basedir}"
                    executable="node_modules/.bin/gwt-api-generator">
                  </exec>
                </target>
              </configuration>
              <goals>
                <goal>run</goal>
              </goals>
            </execution>
          </executions>
        </plugin>



## About GWT 2.7/2.8 compatibility

Vaadin gwt-api-generator produces `@JsType` interfaces for JS Element level access from Java Objects.

Since `JsInterop` was a feature experimental in GWT-2.7.0 and stable in GWT-2.8.0, and its implementation has absolutly changed from the experimental to the stable API, we have decided not to support old releases anymore, starting with gwt-api-generator 1.2.1.

## Modifying the `bower_components` folder

The `gwt-polymer-elements` library is bundled with all web components placed in a the `bower_components` folder.
Though, the developer might change this location by setting the `window.gwtBowerLocation` property, or by calling the `Polymer.setGwtBowerLocation(location)` method in the application entry point.

