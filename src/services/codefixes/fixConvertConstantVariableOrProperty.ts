/* @internal */
namespace ts.codefix {
    const fixId = "fixConvertConstToLet";
    const errorCodes = [
        Diagnostics.Cannot_assign_to_0_because_it_is_a_constant_or_a_read_only_property.code
    ];

    registerCodeFix({
        errorCodes,
        getCodeActions(context) {
            const { sourceFile, span } = context;
            const { declaration, kind, name } = getDeclaration(sourceFile, span.start);
            if (!declaration) return undefined;
            const changes = textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, declaration, kind));
            console.log("[INFO] Name", name);
            const type = kind === SyntaxKind.ConstKeyword ? "const" : "readonly";
            return [createCodeFixAction(fixId, changes, [Diagnostics.Converting_0_to_be_not_1, name, type], fixId, Diagnostics.Converting_all_reassigned_variable_to_be_non_constant)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => codeFixAll(context, errorCodes, (changes, diag) => {
            const { kind, declaration } = getDeclaration(diag.file, diag.start, context);
            if (declaration) doChange(changes, context.sourceFile, declaration, kind);
        }),
    });

    function getDeclaration(sourceFile: SourceFile, pos: number): {declaration: Node, kind: SyntaxKind, name: DeclarationName} {
        const node = getTokenAtPosition(sourceFile, pos);
        let declaration: Node;
        let kind: SyntaxKind;
        let name: DeclarationName;
        if (isVarConst(node)) {
            declaration = findAncestor(node, isVariableDeclaration);
            name = getNameOfDeclaration(declaration);
            kind = SyntaxKind.ConstKeyword;
        }
        else if (hasReadOnlyModifier(node)) {
            declaration = findAncestor(node, isPropertyDeclaration);
            name = getNameOfDeclaration(declaration);
            kind = SyntaxKind.ReadonlyKeyword;
        }
        return { kind, declaration, name };
    }

    function doChange(changes: textChanges.ChangeTracker, sourceFile: SourceFile, node: Node, kind: SyntaxKind) {
        if (kind === SyntaxKind.ConstKeyword) {
            const letNode: Node = createNode(SyntaxKind.LetKeyword, node.getStart(), node.getEnd());
            changes.replaceNode(sourceFile, node, letNode);
        }
        // else if (kind === SyntaxKind.ReadonlyKeyword) {
        // Add logic for handling readonly case here
        // }
    }
}