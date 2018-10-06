/// <reference path='fourslash.ts' />

////class Test {
////    readonly prop = 5;
////}
////let testInstance = new Test();
////testInstance.prop = 3;

verify.codeFix({
    description: "Convert const variable to let",
    newFileContent:
`class Test{
    prop = 5;
}
let testInstance = new Test();
testInstance.prop = 3;`,
});
