import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh } from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { IUserOnBot } from '../../models';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import './aiTrading.css';

/**
 * Always the USER's own PnL:
 *  - closed positions: their realized PnL stored at close
 *  - active positions: live PnL from THEIR entry price vs current price
 */
const computePnl = (item: IUserOnBot): number => {
  const isActive = item.active ?? false;
  if (!isActive && item.profit != null) return item.profit ?? 0;
  const amount = item.amount ?? 0;
  const entryPrice = item.entryPrice ?? 0;
  const currentPrice = item.currentPrice ?? 0;
  const isLong = item.bot?.direction?.toLowerCase() === 'long';
  const priceDelta =
    entryPrice > 0
      ? isLong
        ? (currentPrice - entryPrice) / entryPrice
        : (entryPrice - currentPrice) / entryPrice
      : 0;
  return amount * priceDelta;
};

const Row = ({
  label,
  value,
  color,
  faded,
}: {
  label: string;
  value: string;
  color?: string;
  faded?: boolean;
}) => (
  <div className="order-card__row" style={{ opacity: faded ? 0.6 : 1 }}>
    <span className="muted">{label}</span>
    <strong style={color ? { color } : undefined}>{value}</strong>
  </div>
);

export const RunningBots = observer(() => {
  const { aiStore } = appRootStore;
  const [confirming, setConfirming] = useState<IUserOnBot | null>(null);

  useEffect(() => {
    aiStore.botsByUser();
  }, [aiStore]);

  const { myBots, isLoadingBots } = aiStore;
  const sortedBots = [...myBots].reverse();
  const closedProfit = myBots.filter(m => !(m.active ?? false)).reduce((s, m) => s + computePnl(m), 0);
  const currentPnl = myBots.filter(m => m.active ?? false).reduce((s, m) => s + computePnl(m), 0);
  const totalPnl = closedProfit + currentPnl;

  const pnlColor = (v: number) => (v >= 0 ? 'var(--color-secondary)' : 'var(--color-red)');
  const signed = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)} LFC`;
  const copyFee = lightexchange.app.BOT?.COPY_FEE ?? 10;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="screen-title" style={{ marginBottom: 0 }}>
          {translate('aiTrading.runningBotsTitle')}
        </h1>
        <button
          type="button"
          className="balance__refresh"
          onClick={() => aiStore.botsByUser()}
          aria-label="Refresh"
        >
          {isLoadingBots ? (
            <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />
          ) : (
            <FontAwesomeIcon icon={faRefresh} style={{ color: 'var(--color-secondary)' }} />
          )}
        </button>
      </div>

      {sortedBots.length === 0 ? (
        <div className="card empty-state">{translate('aiTrading.noBots')}</div>
      ) : (
        <>
          <div className="card stack" style={{ gap: 6 }}>
            <strong>{translate('aiTrading.summaryTitle')}</strong>
            <Row
              label={translate('aiTrading.closedProfit')}
              value={signed(closedProfit)}
              color={pnlColor(closedProfit)}
            />
            <Row
              label={translate('aiTrading.currentPnlTotal')}
              value={signed(currentPnl)}
              color={pnlColor(currentPnl)}
            />
            <Row
              label={translate('aiTrading.currentPnl')}
              value={signed(totalPnl)}
              color={pnlColor(totalPnl)}
            />
          </div>

          {sortedBots.map(item => {
            const amount = item.amount ?? 0;
            const entryPrice = item.entryPrice ?? 0;
            const currentPrice = item.currentPrice ?? 0;
            const direction = item.bot?.direction?.toLowerCase();
            const isActive = item.active ?? false;
            // Active but no entry price yet => the admin hasn't started the
            // trade; this copy waits.
            const isWaiting = isActive && entryPrice <= 0;
            const pnl = computePnl(item);
            const faded = !isActive;

            return (
              <div className="card stack" key={item.id} style={{ gap: 6, opacity: faded ? 0.8 : 1 }}>
                <div className="order-card__row">
                  <strong>{item.bot?.title} BOT</strong>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="muted">{item.bot?.pair}</span>
                    <span
                      className="order-status"
                      style={{
                        color: 'var(--color-white)',
                        background:
                          direction === 'long' || direction === 'grid'
                            ? 'var(--color-secondary)'
                            : 'var(--color-red)',
                      }}
                    >
                      {item.bot?.direction?.toUpperCase()}
                    </span>
                  </span>
                </div>

                <Row
                  label={translate('aiTrading.invested')}
                  value={`${amount.toFixed(2)} LFC`}
                  faded={faded}
                />

                {isWaiting ? (
                  <p className="muted">Waiting to enter the trade</p>
                ) : (
                  <>
                    <Row
                      label={translate('aiTrading.entryPrice')}
                      value={`$${entryPrice.toFixed(2)}`}
                      faded={faded}
                    />
                    <Row
                      label={translate('aiTrading.currentPrice')}
                      value={`$${currentPrice.toFixed(2)}`}
                      faded={faded}
                    />
                    {item.takeProfit != null ? (
                      <Row
                        label={translate('aiTrading.takeProfitLabel')}
                        value={`$${item.takeProfit.toFixed(2)}${
                          item.closedBy === 'takeProfit' ? ' ✓' : ''
                        }`}
                        color="var(--color-secondary)"
                        faded={faded}
                      />
                    ) : null}
                    {item.stopLoss != null ? (
                      <Row
                        label={translate('aiTrading.stopLossLabel')}
                        value={`$${item.stopLoss.toFixed(2)}${
                          item.closedBy === 'stopLoss' ? ' ✓' : ''
                        }`}
                        color="var(--color-red)"
                        faded={faded}
                      />
                    ) : null}
                    <Row
                      label={
                        isActive
                          ? translate('aiTrading.currentPnl')
                          : translate('aiTrading.finalPnl')
                      }
                      value={signed(pnl)}
                      color={pnlColor(pnl)}
                      faded={faded}
                    />
                  </>
                )}

                <span className="order-card__date">
                  {moment(parseInt(item.subscribedDatetime ?? '0')).fromNow()}
                </span>

                {isActive ? (
                  <Button variant="secondary" onClick={() => setConfirming(item)}>
                    {translate('aiTrading.closePosition')}
                  </Button>
                ) : null}
              </div>
            );
          })}
        </>
      )}

      {/* Mobile uses Alert.alert for this confirmation. */}
      {confirming ? (
        <Modal onClose={() => setConfirming(null)}>
          <div className="stack">
            <h2>{translate('aiTrading.closePosition')}</h2>
            <p>{copyFee} LFC copy fee will be deducted from your return.</p>
            <div className="bot-actions">
              <Button block variant="secondary" onClick={() => setConfirming(null)}>
                {translate('transactionConfirmation.cancelBtn')}
              </Button>
              <Button
                block
                onClick={() => {
                  aiStore.botUnsubscribe(confirming.id!);
                  setConfirming(null);
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
});
