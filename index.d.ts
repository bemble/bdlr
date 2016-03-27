namespace Bdlr {
  enum BundleType {STYLE, SCRIPT}

  export interface Bundle {
    files:Array<string>;
    rebase(rebaseConf:{[baseDir:string]:string}):Bundle;

    (type:BundleType, renderedUrl:string):Bundle;
    includeFile(filePath:string):Bundle;
    includeGlob(glob:string, ignoredPatterns?:Array<string>):Bundle;
    includeBowerComponents(includeDevComponents:boolean, ignoredPackages?:Array<string>):Bundle;

    toString():string;
    getMinifiedContent():string;
  }

  export interface Bdlr {
    SCRIPT:BundleType;
    STYLE:BundleType;
    ENV:string;
    bundles:{[name:string]: Bundle};
    createBundle(name:string, type:BundleType, renderedUrl?:string);
  }
}

declare module "bdlr" {
  var bdlr:Bdlr.Bdlr;
  export = bdlr;
}