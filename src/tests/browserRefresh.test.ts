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
 *
 * These tests exercise refreshBrowsers() with a mock plugin so we can assert
 * refresh() is called on the correct view without needing Obsidian running.
 * React / Obsidian imports are mocked out so the module chain resolves cleanly.
 */

// Mock the entire browser view module so we get the constant without pulling
// in React, react-dom, or Obsidian's ItemView.
jest.mock('../features/browser/ContentBrowserView', () => ({
    Content_Browser_View_Type: 'daggerforge:content-browser',
}));

// pluginOperations imports ContentBrowserView only for the view type constant
// and calls getLeavesOfType — both are safe once the mock above is in place.
import { refreshBrowsers } from '../utils/pluginOperations';

const CONTENT_BROWSER_VIEW_TYPE = 'daggerforge:content-browser';
const OLD_ADV_VIEW_TYPE         = 'daggerforge:adversary-search';
const OLD_ENV_VIEW_TYPE         = 'daggerforge:environment-search';

const testResults: string[] = [];

function logResult(testName: string, expected: any, actual: any, passed: boolean) {
    testResults.push(`Test: ${testName}`);
    testResults.push(`  Expected: ${expected}`);
    testResults.push(`  Actual:   ${actual}`);
    testResults.push(`  Result:   ${passed ? 'PASS' : 'FAIL'}`);
    testResults.push('');
}

afterAll(() => {
    console.log(`
========================================
BROWSER REFRESH TEST RESULTS
========================================

${testResults.join('\n')}`);
});

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeView(overrides: Partial<{ refresh: () => void }> = {}) {
    return { refresh: jest.fn(), ...overrides };
}

function makePlugin(leaves: { viewType: string; view: object }[]) {
    return {
        app: {
            workspace: {
                getLeavesOfType: (type: string) =>
                    leaves
                        .filter(l => l.viewType === type)
                        .map(l => ({ view: l.view })),
            },
        },
    } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('refreshBrowsers — unified Content Browser', () => {

    test('calls refresh() on an open Content Browser view', () => {
        const view = makeView();
        const plugin = makePlugin([{ viewType: CONTENT_BROWSER_VIEW_TYPE, view }]);

        refreshBrowsers(plugin);

        const passed = (view.refresh as jest.Mock).mock.calls.length === 1;
        logResult(
            'calls refresh() when Content Browser is open',
            'refresh called once',
            passed ? 'refresh called once' : 'not called',
            passed,
        );
        expect(view.refresh).toHaveBeenCalledTimes(1);
    });

    test('does nothing when Content Browser is not open', () => {
        const plugin = makePlugin([]);
        expect(() => refreshBrowsers(plugin)).not.toThrow();
        logResult('no error when panel is closed', 'no throw', 'no throw', true);
    });

    test('does NOT refresh old Adv_View_Type — regression guard', () => {
        const advView = makeView();
        const plugin = makePlugin([{ viewType: OLD_ADV_VIEW_TYPE, view: advView }]);

        refreshBrowsers(plugin);

        const called = (advView.refresh as jest.Mock).mock.calls.length;
        const passed = called === 0;
        logResult(
            'ignores old Adv_View_Type (regression: was a silent no-op, must stay that way)',
            '0 calls',
            `${called} calls`,
            passed,
        );
        expect(advView.refresh).not.toHaveBeenCalled();
    });

    test('does NOT refresh old Env_View_Type — regression guard', () => {
        const envView = makeView();
        const plugin = makePlugin([{ viewType: OLD_ENV_VIEW_TYPE, view: envView }]);

        refreshBrowsers(plugin);

        const called = (envView.refresh as jest.Mock).mock.calls.length;
        const passed = called === 0;
        logResult(
            'ignores old Env_View_Type (regression: was a silent no-op, must stay that way)',
            '0 calls',
            `${called} calls`,
            passed,
        );
        expect(envView.refresh).not.toHaveBeenCalled();
    });

    test('refreshes all open Content Browser leaves (split-window case)', () => {
        const viewA = makeView();
        const viewB = makeView();
        const plugin = makePlugin([
            { viewType: CONTENT_BROWSER_VIEW_TYPE, view: viewA },
            { viewType: CONTENT_BROWSER_VIEW_TYPE, view: viewB },
        ]);

        refreshBrowsers(plugin);

        const passed =
            (viewA.refresh as jest.Mock).mock.calls.length === 1 &&
            (viewB.refresh as jest.Mock).mock.calls.length === 1;
        logResult(
            'refreshes all open Content Browser leaves',
            'both refreshed',
            passed ? 'both refreshed' : 'one or both missed',
            passed,
        );
        expect(viewA.refresh).toHaveBeenCalledTimes(1);
        expect(viewB.refresh).toHaveBeenCalledTimes(1);
    });

    test('handles a view missing refresh() gracefully', () => {
        const plugin = makePlugin([{ viewType: CONTENT_BROWSER_VIEW_TYPE, view: {} }]);
        expect(() => refreshBrowsers(plugin)).not.toThrow();
        logResult('view without refresh() does not throw', 'no throw', 'no throw', true);
    });
});
