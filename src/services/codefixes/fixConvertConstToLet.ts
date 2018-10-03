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
            const { declaration, kind } = getDeclaration(sourceFile, span.start);
            if (!declaration) return undefined;

            const changes = textChanges.ChangeTracker.with(context, t => doChange(t, sourceFile, node, kind));
            return [createCodeFixAction(fixId, changes, Diagnostics.Cannot_assign_to_0_because_it_is_a_constant_or_a_read_only_property, fixId, Diagnostics.Cannot_assign_to_0_because_it_is_a_constant_or_a_read_only_property)];
        },
        fixIds: [fixId],
        getAllCodeActions: context => codeFixAll(context, errorCodes, (changes, diag) => {
            const { kind, declaration } = getDeclaration(diag.file, diag.start, context);
            if (declaration) doChange(changes, context.sourceFile, declaration, kind);
        }),
    });

    function getDeclaration(sourceFile: SourceFile, pos: number, context: CodeFixContextBase): {declaration: Node, kind: SyntaxKind} {
        const node = getTokenAtPosition(sourceFile, pos);
        let declaration: Node;
        let kind: SyntaxKind;
        if (isVarConst(node)) {
            declaration = findAncestor(node, isVariableDeclaration);
            kind = SyntaxKind.ConstKeyword;
        } else if (hasReadOnlyModifier(node)) {
            declaration = findAncestor(node, isPropertyDeclaration);
            kind = SyntaxKind.ReadonlyKeyword;
        }
        return { kind, declaration };
    }

    function doChange(changes: textChanges.ChangeTracker, sourceFile: SourceFile, node: Node, kind: SyntaxKind) {
        if (kind === SyntaxKind.ConstKeyword) {
            let letNode: Node = createNode(SyntaxKind.LetKeyword, node.getStart(), node.getEnd(), node.parent);
            changes.replaceNode(sourceFile, node, letNode);
        } else if (kind === SyntaxKind.ReadonlyKeyword) {
            // let 
        }
    }
}