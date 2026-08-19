import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRefresh,
  faArrowDown,
  faArrowUp,
  faArrowRightArrowLeft,
  faPaperPlane,
  faCartShopping,
  faTag,
  faSliders,
} from '@fortawesome/free-solid-svg-icons';
import { appRootStore } from '../../stores/root.store';
import { translate } from '../../helpers/localization';
import { getColorByType } from '../../helpers/trading';
import { MODALS } from '../../consts/modals';
import { ITransaction } from '../../models';
import { Button } from '../../components/ui/Button';
import { WalletBalance } from './WalletBalance';
import './wallet.css';

const TRANSACTION_TYPES = [
  lightexchange.app.TRANSACTION.TYPE.all,
  lightexchange.app.TRANSACTION.TYPE.convert,
  lightexchange.app.TRANSACTION.TYPE.buy,
  lightexchange.app.TRANSACTION.TYPE.sell,
  lightexchange.app.TRANSACTION.TYPE.transfer,
  lightexchange.app.TRANSACTION.TYPE.withdrawal,
];

const TYPE = lightexchange.app.TRANSACTION.TYPE;
const STATUS = lightexchange.app.TRANSACTION.STATUS;

// Money leaving the wallet is shown with a minus, money arriving with a plus.
const OUTGOING = [TYPE.withdrawal, TYPE.withdrawalCrypto, TYPE.transfer, TYPE.sell];

const ICONS: Record<string, any> = {
  [TYPE.deposit]: faArrowDown,
  [TYPE.depositCrypto]: faArrowDown,
  [TYPE.recharge]: faArrowDown,
  [TYPE.withdrawal]: faArrowUp,
  [TYPE.withdrawalCrypto]: faArrowUp,
  [TYPE.convert]: faArrowRightArrowLeft,
  [TYPE.transfer]: faPaperPlane,
  [TYPE.buy]: faCartShopping,
  [TYPE.sell]: faTag,
};

const STATUS_COLOR: Record<string, string> = {
  [STATUS.successful]: 'var(--color-green)',
  [STATUS.pending]: '#C77700',
  [STATUS.initiated]: 'var(--color-white2)',
  [STATUS.failed]: 'var(--color-red)',
};

// Same-day transactions belong together: the date is stated once as a header
// instead of being repeated on every row.
function groupByDay(transactions: ITransaction[]) {
  const sorted = [...transactions].sort(
    (a, b) => parseFloat(b.date || '0') - parseFloat(a.date || '0'),
  );
  const sections: { key: string; items: ITransaction[] }[] = [];
  sorted.forEach(t => {
    const key = moment(parseFloat(t.date || '0')).format('YYYY-MM-DD');
    const last = sections[sections.length - 1];
    if (!last || last.key !== key) sections.push({ key, items: [t] });
    else last.items.push(t);
  });
  return sections;
}

function dayLabel(key: string) {
  const d = moment(key, 'YYYY-MM-DD');
  const today = moment().startOf('day');
  if (d.isSame(today, 'day')) return translate('walletHistory.today');
  if (d.isSame(today.clone().subtract(1, 'day'), 'day'))
    return translate('walletHistory.yesterday');
  return d.isSame(today, 'year') ? d.format('D MMMM') : d.format('D MMMM YYYY');
}

const TransactionDetail = observer(({ item }: { item: ITransaction }) => {
  const { tradeStore } = appRootStore;
  const { id, transactionId, receive, date, type, status, userNumber, wallets, users } = item;
  const rows = [
    [translate('trading.amountTxt'), receive],
    [translate('trading.idTxt'), transactionId],
    [translate('trading.typeTxt'), type],
    [translate('trading.userNumberTxt'), userNumber?.phone],
    [translate('trading.walletTxt'), wallets?.[0]?.fiat?.name || wallets?.[0]?.crypto?.token],
    ...(users && users.length > 1 && users[1]
      ? [[translate('transactionDetail.receiverTxt'), users[1]?.username]]
      : []),
    [translate('trading.statusTxt'), status],
    [translate('trading.dateTxt'), moment(parseFloat(date!)).format('MM-DD-YYYY, h:mm:ss a')],
  ] as Array<[string, any]>;

  return (
    <div className="stack">
      <table className="tx-table">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th scope="row">{label}</th>
              <td>{value ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {status === lightexchange.app.TRANSACTION.STATUS.pending ? (
        <Button
          block
          onClick={() => {
            tradeStore.transactionCheckStatus(id, type);
            lightexchange.AppEventEmitter.emit(
              lightexchange.AppEvents.HideModal,
              MODALS.transactionDetail,
            );
          }}
        >
          {translate('transactionDetail.statusTxt')} <FontAwesomeIcon icon={faRefresh} />
        </Button>
      ) : null}
    </div>
  );
});

export const WalletHistory = observer(() => {
  const { tradeStore, walletStore } = appRootStore;
  const { transactionType, transactions } = tradeStore;

  useEffect(() => {
    (async () => {
      await tradeStore.getTransactionsByUser();
      await walletStore.getWallets();
    })();
  }, [tradeStore, walletStore]);

  const showDetail = (item: ITransaction) =>
    lightexchange.AppEventEmitter.emit(lightexchange.AppEvents.ShowModal, {
      name: MODALS.transactionDetail,
      modalChildren: <TransactionDetail item={item} />,
      showCloseButton: true,
    });

  return (
    <div className="stack">
      <h1 className="screen-title">{translate('trading.transactionHistory')}</h1>

      <WalletBalance />

      <div className="tx-filters">
        {TRANSACTION_TYPES.map(type => (
          <Button
            key={type}
            variant={transactionType === type ? 'primary' : 'secondary'}
            onClick={() => tradeStore.setTransactionType(type)}
            style={{ minHeight: 36, padding: '0 12px', textTransform: 'capitalize' }}
          >
            {type}
          </Button>
        ))}
      </div>

      {transactions?.length ? (
        <div className="card">
          {groupByDay(transactions as ITransaction[]).map(section => (
            <div key={section.key}>
              <div className="tx-day">{dayLabel(section.key)}</div>
              {section.items.map(item => {
                const wallet = item.wallets?.find(w => w.id == item.initiatorWallet);
                const accent = getColorByType(item.type) ?? 'var(--color-secondary)';
                const outgoing = OUTGOING.includes(item.type as any);
                const isFailed = item.status === STATUS.failed;
                return (
                  <button
                    type="button"
                    className="tx-row"
                    key={item.transactionId}
                    onClick={() => showDetail(item)}
                  >
                    {/* Type is carried by the icon and its tint, freeing the
                        line of text for what differs between two transactions
                        of the same type. */}
                    <span
                      className="tx-row__icon"
                      style={{ background: `color-mix(in srgb, ${accent} 12%, transparent)` }}
                    >
                      <FontAwesomeIcon
                        icon={ICONS[item.type as string] || faSliders}
                        style={{ color: accent }}
                      />
                    </span>
                    <span className="tx-row__middle">
                      <span className="tx-row__label">{item.type}</span>
                      <span className="tx-row__meta">
                        <span>{moment(parseFloat(item.date!)).format('HH:mm')}</span>
                        {/* Only a state worth acting on earns a badge — a
                            successful transaction is the norm. */}
                        {item.status !== STATUS.successful && (
                          <span
                            className="tx-row__badge"
                            style={{
                              color: STATUS_COLOR[item.status!] ?? 'var(--color-text-muted)',
                              background: `color-mix(in srgb, ${
                                STATUS_COLOR[item.status!] ?? 'var(--color-text-muted)'
                              } 13%, transparent)`,
                            }}
                          >
                            {translate(`transactionStatus.${item.status}`)}
                          </span>
                        )}
                      </span>
                    </span>
                    <span
                      className={`tx-row__amount ${
                        isFailed
                          ? 'tx-row__amount--failed'
                          : outgoing
                          ? 'tx-row__amount--out'
                          : 'tx-row__amount--in'
                      }`}
                    >
                      {outgoing ? '-' : '+'}
                      {item.receive} {wallet?.crypto?.name}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>
            {translate('walletHistory.empty')}
          </div>
          <div>
            {translate(
              transactionType !== TYPE.all
                ? 'walletHistory.emptyFiltered'
                : 'walletHistory.emptyHint',
            )}
          </div>
        </div>
      )}
    </div>
  );
});
