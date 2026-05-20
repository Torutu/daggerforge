/**
 * browserRefresh.test.ts
 *
 * Verifies that the Content Browser panel refreshes after card edits.
 *
 * What broke: CardEditor.ts used to call a local refreshBrowserView() with
 * Adv_View_Type / Env_View_Type — view types that no longer exist after the
 * unified Content Browser was introduced. The calls were silent no-ops.
 * Fix: all four call sites now call refreshBrowsers(plugin) which targets
 * Content_Browser_View_Type.
 */

jest.mock('../features/browser/ContentBrowserView', () => ({
    Content_Browser_View_Type: 'daggerforge:content-browser',
}));

import { refreshBrowsers } from '../utils/pluginOperations';

const CONTENT_BROWSER  = 'daggerforge:content-browser';
const OLD_ADV_VIEW     = 'daggerforge:adversary-search';
const OLD_ENV_VIEW     = 'daggerforge:environment-search';

function makeView() {
    return { refresh: jest.fn() };
}

function makePlugin(leaves: { viewType: string; view: object }[]) {
    return {
        app: {
            workspace: {
                getLeavesOfType: (type: string) =>
                    leaves.filter(l => l.viewType === type).map(l => ({ view: l.view })),
            },
        },
    } as any;
}

describe('refreshBrowsers', () => {
    test('calls refresh() on an open Content Browser view', () => {
        const view = makeView();
        refreshBrowsers(makePlugin([{ viewType: CONTENT_BROWSER, view }]));
        expect(view.refresh).toHaveBeenCalledTimes(1);
    });

    test('does nothing when Content Browser is not open', () => {
        expect(() => refreshBrowsers(makePlugin([]))).not.toThrow();
    });

    test('ignores old Adv_View_Type — regression guard', () => {
        const view = makeView();
        refreshBrowsers(makePlugin([{ viewType: OLD_ADV_VIEW, view }]));
        expect(view.refresh).not.toHaveBeenCalled();
    });

    test('ignores old Env_View_Type — regression guard', () => {
        const view = makeView();
        refreshBrowsers(makePlugin([{ viewType: OLD_ENV_VIEW, view }]));
        expect(view.refresh).not.toHaveBeenCalled();
    });

    test('refreshes all open leaves when multiple windows are open', () => {
        const viewA = makeView();
        const viewB = makeView();
        refreshBrowsers(makePlugin([
            { viewType: CONTENT_BROWSER, view: viewA },
            { viewType: CONTENT_BROWSER, view: viewB },
        ]));
        expect(viewA.refresh).toHaveBeenCalledTimes(1);
        expect(viewB.refresh).toHaveBeenCalledTimes(1);
    });

    test('handles a view with no refresh() method gracefully', () => {
        expect(() => refreshBrowsers(makePlugin([{ viewType: CONTENT_BROWSER, view: {} }]))).not.toThrow();
    });
});
