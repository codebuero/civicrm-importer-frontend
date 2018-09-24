# CiviCRM Entity Importer

## Purpose

A sideproject of mine lacked for the possibility to import long lists of exported data from different donation platforms, that offered no other way of gathering data e.g. Rest APIs. Also, the aimed project (Civicrm) is
written in PHP and I didn't want to write a module for Drupal (the base for Civicrm). 
So I did this kind of serverless application, that takes export data from (now one, later more) donation platforms and transfers their content into Civicrm compatible entities. 

Aim was to decouple the import rules making it easy to write further ruleSets. (WIP)


## Installation

After repo clone you should do 
```
npm install
```
to get all neccessary packages.

Then start webpack in watch mode via 
```
npm run watch
```

and to see the result, open another terminal and start a webserver e.g. ```serve``` in the repo root.




