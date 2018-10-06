/// <reference path='fourslash.ts' />

////const variable = 5;
////variable = 3;

verify.codeFix({
    description: "Convert const variable to let when it is being reassigned",
    newFileContent:
`let variable = 5;
variable = 3;`,
});
