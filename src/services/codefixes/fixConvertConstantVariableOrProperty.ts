/* @internal */
namespace ts.codefix {
    const fixId = "fixConvertConstantVariableOrProperty";
    const errorCodes = [
        Diagnostics.Cannot_assign_to_0_because_it_is_a_constant_or_a_read_only_property.code
    ];

    registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { sourceFile, span } = context;
            const { declaration, kind } = getDeclaration(sourceFile, span.start);
            if (!declaration) return undefined;
            const changes = textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, declaration));
            const type = kind === SyntaxKind.ConstKeyword ? "const" : "readonly";
            const changeTo = type === "const" ? "let" : "non-readonly";
            return [createCodeFixAction(fixId, changes, [Diagnostics.Change_0_to_1, declaration.name.getText(), changeTo], fixId, Diagnostics.Extract_constant)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => codeFixAll(context, errorCodes, (changes, diag) => {
            const { declaration } = getDeclaration(diag.file, diag.start);
            if (declaration) doChange(changes, context.sourceFile, declaration);
        }),
    });

    function getDeclaration(sourceFile: SourceFile, pos: number): {declaration: VariableDeclaration | PropertyDeclaration | undefined, kind: SyntaxKind } {
        const node = getTokenAtPosition(sourceFile, pos);
        let declaration: VariableDeclaration | PropertyDeclaration | undefined;
        let kind: SyntaxKind;
        if (hasReadonlyModifier(node)) {
            declaration = findAncestor(node, isPropertyDeclaration);
            kind = SyntaxKind.ReadonlyKeyword;
        }
        else {
            declaration = findAncestor(node, isVariableDeclaration);
            kind = SyntaxKind.ConstKeyword;
        }
        return { declaration, kind };
    }

    function doChange(changes: textChanges.ChangeTracker, sourceFile: SourceFile, node: VariableDeclaration | PropertyDeclaration) {
        if (isVariableDeclaration(node)) {
            const constNode = findChildOfKind(node, SyntaxKind.ConstKeyword, sourceFile);
            if (constNode) {
                const letNode = createNode(SyntaxKind.LetKeyword, constNode.getStart(), node.getEnd());
                changes.replaceNode(sourceFile, constNode, letNode);
            }
        }
        else if (isPropertyDeclaration(node)) {
            const readonlyNode = findChildOfKind(node, SyntaxKind.ReadonlyKeyword, sourceFile);
            if (readonlyNode) {
                changes.delete(sourceFile, readonlyNode);
            }
        }
    }
}