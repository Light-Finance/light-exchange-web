import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import lightexchange from 'light-exchange';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faRefresh } from '@fortawesome/free-solid-svg-icons';
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

/** Coloured dot mirroring mobile's per-status indicator. */
const StatusDot = ({ status }: { status?: string }) => {
  const { STATUS } = lightexchange.app.TRANSACTION;
  if (status === STATUS.pending) return <span className="btn__spinner" style={{ color: 'var(--color-secondary)' }} />;
  const color =
    status === STATUS.failed
      ? 'var(--color-red)'
      : status === STATUS.initiated
      ? 'var(--color-black)'
      : 'var(--color-green)';
  return <FontAwesomeIcon icon={faCircle} style={{ color }} title={status} />;
};

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
        <div className="card tx-table-wrap">
          <table className="tx-table">
            <thead>
              <tr>
                <th>{translate('trading.typeTxt')}</th>
                <th>{translate('trading.idTxt')}</th>
                <th>{translate('trading.amountTxt')}</th>
                <th>{translate('trading.dateTxt')}</th>
                <th>{translate('trading.statusTxt')}</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(item => {
                const wallet = item.wallets?.find(w => w.id == item.initiatorWallet);
                return (
                  <tr
                    key={item.transactionId}
                    onClick={() => showDetail(item)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <span
                        className="tx-type"
                        style={{ background: getColorByType(item.type) ?? 'var(--color-black)' }}
                      >
                        {item.type?.slice(0, 10)}
                      </span>
                    </td>
                    <td>{item.transactionId}</td>
                    <td>
                      <strong>
                        {item.receive} {wallet?.crypto?.name}
                      </strong>
                    </td>
                    <td>
                      {moment(parseFloat(item.date!)).format(lightexchange.app.INFO.DATE_FORMAT)}
                    </td>
                    <td>
                      <StatusDot status={item.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">{translate('transactionHistoryC.history')}</div>
      )}
    </div>
  );
});
